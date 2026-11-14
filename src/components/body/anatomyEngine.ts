/** AnatomyScene — the 3D engine behind the viewer.
 *
 * One instance owns the renderer, camera, lights, and the currently mounted
 * atlas. Structures are mounted per chunk as zero-copy typed-array views into
 * the decompressed chunk ArrayBuffer:
 *
 *   positions: Float32Array(buffer, part.positions, part.vertexCount * 3)
 *   normals:   Int16Array (buffer, part.normals,   part.vertexCount * 3)  // unit*32767
 *   indices:   Uint32Array(buffer, part.indices,   part.indexCount)
 *
 * For rendering, structures of the same (system, chunk) are merged into one
 * geometry. Every vertex carries a `partIndex` attribute that indexes into a
 * small RGBA-float texture holding that structure's runtime state: xyz = explode
 * offset, w = visibility. A second byte texture drives hover/selection tint.
 * This keeps the whole atlas at a handful of draw calls while every one of the
 * thousands of structures stays individually addressable.
 *
 * Picking uses detached per-structure meshes (cheap bounding-box pre-test,
 * then exact ray/geometry intersection), moved in step with the explode offsets.
 */
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { AtlasLibrary } from "../../lib/anatomy/loader";
import { packInventory } from "../../lib/anatomy/layout";
import {
  SYSTEM_META,
  SYSTEM_MAP,
  type AtlasManifest,
  type Part,
  type SystemId,
} from "../../lib/anatomy/types";

export type ViewId = 'three-quarter' | 'front' | 'back' | 'side';

export interface EngineState {
  visible: SystemId[];
  selected: string[];
  /** Body systems drawn in full color. Everything else fades back. */
  emphasis: SystemId[];
  isolate: boolean;
  explode: number;
  view: ViewId;
  autoRotate: boolean;
  reset: number;
  focus: number;
}

export interface HoverInfo {
  id: string;
  name: string;
  system: SystemId;
  x: number;
  y: number;
}

export interface EngineCallbacks {
  onHover: (info: HoverInfo | null) => void;
  onPick: (partId: string | null, system?: SystemId) => void;
  onActivate: (partId: string) => void;
  onProgress: (p: { loaded: number; total: number } | null) => void;
  onError: (message: string) => void;
}

const ACCENT = new THREE.Color("#24554b");
const FAN_RADIUS = 0.52;
const STAGE_Y = 0.85;

interface Tap {
  x: number;
  y: number;
  pointerId: number;
  drag: boolean;
  threshold: number;
}

interface Tween {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  t: number;
  dur: number;
}

export class AnatomyEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private library = new AtlasLibrary();
  private cb: EngineCallbacks;
  private host: HTMLElement;

  // Atlas currently mounted
  private atlas: AtlasManifest | null = null;
  private manifestUrl = '';
  private partsByChunk = new Map<number, Part[]>();
  private partIndex = new Map<string, number>();
  private stateWidth = 1;
  private stateData!: Float32Array;
  private selData!: Uint8Array;
  private stateTexture!: THREE.DataTexture;
  private selTexture!: THREE.DataTexture;
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private batchMeshes: THREE.Mesh[] = [];
  private pickerMeshes: (THREE.Mesh | undefined)[] = [];
  private pickerGeometries: THREE.BufferGeometry[] = [];
  private loadedChunks = new Set<number>();
  private bounds3: THREE.Box3[] = [];
  private centers: THREE.Vector3[] = [];
  private systemOrder = new Map<SystemId, number>();

  // Runtime
  private state: EngineState | null = null;
  private amount = 0;
  private hoverIndex = -1;
  private layout: ReturnType<typeof packInventory> | null = null;
  private layoutKey = '';
  private stage = new THREE.Group();
  private gen = 0;
  private disposed = false;
  private frame = 0;
  private dirty = true;
  private tween: Tween | null = null;
  private lastTime = performance.now();
  private tap: Tap | null = null;
  private lastClick = { id: '', t: 0 };
  private hoverThrottle = 0;
  private pendingFrameAfterLoad = false;
  private lastReset = -1;
  private lastFocus = -1;
  private lastView: ViewId | '' = '';
  private loadingKey = '';

  constructor(host: HTMLElement, cb: EngineCallbacks) {
    this.host = host;
    this.cb = cb;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      throw new Error('This browser could not start WebGL.');
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D human anatomy. Drag to orbit, scroll to zoom, click a structure to inspect it.'
    );
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    this.camera.position.set(1.35, 1.15, 3.3);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, STAGE_Y, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.06;
    this.controls.maxDistance = 28;
    this.controls.maxPolarAngle = Math.PI * 0.97;
    this.controls.autoRotateSpeed = 0.8;
    this.controls.addEventListener('change', () => {
      this.dirty = true;
    });

    // Lighting matched to the AURA paper stage: warm key, mint rim.
    this.scene.add(new THREE.HemisphereLight(0xf7f8f3, 0xc5d5c8, 1.05));
    const key = new THREE.DirectionalLight(0xfff6ea, 1.35);
    key.position.set(2.8, 4.4, 2.6);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xc1ebc9, 0.72);
    rim.position.set(-2.8, 2.2, -2.4);
    this.scene.add(rim);
    const fill = new THREE.DirectionalLight(0xe7f3ea, 0.35);
    fill.position.set(0.4, 1.2, 3.2);
    this.scene.add(fill);

    this.buildStage();
    this.scene.add(this.stage);

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerCancel);
    el.addEventListener('pointerleave', this.onPointerLeave);
    this.resize();
    this.animate();
  }

  // ---------------------------------------------------------------- stage --
  private buildStage() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(30, 64),
      new THREE.MeshStandardMaterial({ color: 0xe7f0e8, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.66, 0.02, 96),
      new THREE.MeshStandardMaterial({ color: 0xf4f7f2, metalness: 0.04, roughness: 0.72 })
    );
    platform.position.y = -0.012;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.612, 128),
      new THREE.MeshBasicMaterial({ color: 0x24554b, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.508, 128),
      new THREE.MeshBasicMaterial({ color: 0xc1ebc9, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.002;
    this.stage.add(floor, platform, ring, ring2);
  }

  // ------------------------------------------------------------- mounting --
  /** Mount a (possibly different) atlas. Safe to call repeatedly. */
  async setAtlas(manifestUrl: string, opts: { frameAfterLoad?: boolean } = {}) {
    if (this.disposed) return;
    this.pendingFrameAfterLoad = !!opts.frameAfterLoad;
    if (this.manifestUrl === manifestUrl && this.atlas) return;
    // Switch generation first so in-flight chunk mounts from the previous
    // atlas stop; the geometry itself is torn down only after the new
    // manifest resolves, so nothing can mount against half-swapped state.
    const gen = ++this.gen;
    this.manifestUrl = manifestUrl;
    try {
      const atlas = await this.library.manifest(manifestUrl);
      if (gen !== this.gen || this.disposed) return;
      this.teardownAtlas();
      this.atlas = atlas;
      this.partsByChunk.clear();
      this.partIndex.clear();
      atlas.parts.forEach((p, i) => {
        this.partIndex.set(p.id, i);
        const list = this.partsByChunk.get(p.chunk) ?? [];
        list.push(p);
        this.partsByChunk.set(p.chunk, list);
      });
      this.bounds3 = atlas.parts.map(
        (p) => new THREE.Box3(new THREE.Vector3(...p.bounds[0]), new THREE.Vector3(...p.bounds[1]))
      );
      this.centers = this.bounds3.map((b) => b.getCenter(new THREE.Vector3()));
      this.systemOrder = new Map(SYSTEM_META.map((s, i) => [s.id, i]));
      this.stateWidth = Math.pow(2, Math.ceil(Math.log2(Math.max(2, atlas.parts.length))));
      this.stateData = new Float32Array(this.stateWidth * 4);
      this.selData = new Uint8Array(this.stateWidth * 4);
      this.stateTexture?.dispose();
      this.selTexture?.dispose();
      this.stateTexture = new THREE.DataTexture(
        this.stateData, this.stateWidth, 1, THREE.RGBAFormat, THREE.FloatType
      );
      this.selTexture = new THREE.DataTexture(this.selData, this.stateWidth, 1);
      this.stateTexture.needsUpdate = true;
      this.selTexture.needsUpdate = true;
      this.hoverIndex = -1;
      this.layout = null;
      this.layoutKey = '';
      // Re-run state against the new atlas.
      if (this.state) this.setState(this.state);
    } catch (e) {
      if (gen === this.gen) this.cb.onError(e instanceof Error ? e.message : 'The atlas could not be loaded.');
    }
  }

  private teardownAtlas() {
    for (const m of this.batchMeshes) {
      this.scene.remove(m);
      m.geometry.dispose();
    }
    this.batchMeshes = [];
    for (const g of this.pickerGeometries) g.dispose();
    this.pickerGeometries = [];
    this.pickerMeshes = [];
    this.loadedChunks.clear();
    this.materials.forEach((m) => m.dispose());
    this.materials.clear();
  }

  private materialFor(system: SystemId): THREE.MeshStandardMaterial {
    const existing = this.materials.get(system);
    if (existing) return existing;
    const meta = SYSTEM_MAP[system];
    const color = new THREE.Color(meta?.color ?? "#8d9996");
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    // Atlas swatches were tuned for a dark stage. Cap lightness so they
    // stay readable on the paper viewport.
    color.setHSL(hsl.h, Math.min(1, hsl.s * 1.08), Math.min(hsl.l, 0.58));
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.04,
      roughness: 0.62,
      side: THREE.DoubleSide,
      transparent: system === 'integumentary',
      opacity: system === 'integumentary' ? 0.13 : 1,
      depthWrite: system !== 'integumentary',
    });
    mat.onBeforeCompile = this.patchMaterial;
    this.materials.set(system, mat);
    return mat;
  }

  private patchMaterial = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uState = { value: this.stateTexture };
    shader.uniforms.uSel = { value: this.selTexture };
    shader.uniforms.uStateW = { value: this.stateWidth };
    shader.uniforms.uAccent = { value: ACCENT }; // shared, so setAccent() repaints every material
    shader.vertexShader =
      `attribute float partIndex;
       uniform sampler2D uState;
       uniform sampler2D uSel;
       uniform float uStateW;
       varying float vVis;
       varying float vSel;
      ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vec2 stUv = vec2((partIndex + 0.5) / uStateW, 0.5);
       vec4 st = texture2D(uState, stUv);
       transformed += st.xyz;
       vVis = st.w;
       vSel = texture2D(uSel, stUv).r;`
    );
    shader.fragmentShader =
      `varying float vVis;
       varying float vSel;
       uniform vec3 uAccent;
      ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
       if (vVis < 0.5) discard;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       float k = vSel > 0.9 ? 0.5 : vSel > 0.05 ? 0.22 : 0.0;
       diffuseColor.rgb = mix(diffuseColor.rgb, uAccent, k);`
    );
  };

  // -------------------------------------------------------------- loading --
  private async ensureChunks(required: number[]) {
    if (!this.atlas || this.disposed) return;
    const gen = this.gen;
    const atlas = this.atlas; // chunk queues serve exactly one atlas
    const missing = required.filter((c) => !this.loadedChunks.has(c));
    const key = required.join(',');
    this.loadingKey = key;
    if (missing.length === 0) {
      this.cb.onProgress(null);
      if (this.pendingFrameAfterLoad) {
        this.pendingFrameAfterLoad = false;
        this.frameVisible();
      }
      return;
    }
    let loaded = 0;
    const total = missing.length;
    this.cb.onProgress({ loaded: 0, total });
    let cursor = 0;
    const worker = async () => {
      while (cursor < total) {
        const ci = missing[cursor++];
        try {
          const buffer = await this.library.chunk(this.manifestUrl, atlas.chunks[ci]);
          if (gen !== this.gen || this.disposed || this.atlas !== atlas) return;
          this.mountChunk(ci, buffer, atlas);
        } catch (e) {
          if (gen === this.gen) {
            this.cb.onError(e instanceof Error ? e.message : 'An anatomy file could not be loaded.');
          }
          return;
        }
        loaded++;
        if (gen === this.gen && this.loadingKey === key) this.cb.onProgress({ loaded, total });
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, total) }, worker));
    if (gen !== this.gen || this.disposed) return;
    if (this.loadingKey === key) this.cb.onProgress(null);
    if (this.pendingFrameAfterLoad) {
      this.pendingFrameAfterLoad = false;
      this.frameVisible();
    }
  }

  private mountChunk(ci: number, buffer: ArrayBuffer, atlas: AtlasManifest) {
    const parts = this.partsByChunk.get(ci);
    if (!parts || this.loadedChunks.has(ci)) return;
    this.loadedChunks.add(ci);
    const groups = new Map<SystemId, { parts: Part[]; geoms: THREE.BufferGeometry[] }>();
    parts.forEach((p) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3)
      );
      g.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true)
      );
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
      g.setAttribute(
        'partIndex',
        new THREE.BufferAttribute(new Float32Array(p.vertexCount).fill(this.partIndex.get(p.id)!), 1)
      );
      const entry = groups.get(p.system) ?? { parts: [], geoms: [] };
      entry.parts.push(p);
      entry.geoms.push(g);
      groups.set(p.system, entry);
    });
    groups.forEach((entry, system) => {
      const merged = mergeGeometries(entry.geoms, false);
      entry.geoms.forEach((g) => g.dispose()); // merged copies the bytes
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, this.materialFor(system));
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.batchMeshes.push(mesh);
      this.buildPickers(entry.parts, merged);
    });
    // The merged geometry now holds everything; the raw chunk buffer is dead
    // weight, so hand it back for collection. Re-mounting re-fetches it.
    this.library.release(this.manifestUrl, atlas.chunks[ci]);
    this.dirty = true;
    if (this.state) this.refreshState();
  }

  /** Zero-copy picking meshes: each shares the merged position array and a
   *  slice of the merged index, with the part's own bounding sphere. They are
   *  never rendered, so the shared arrays are never duplicated. */
  private buildPickers(parts: Part[], merged: THREE.BufferGeometry) {
    const pos = merged.getAttribute('position') as THREE.BufferAttribute;
    const idx = merged.getIndex();
    if (!idx) return;
    const idxArr = idx.array as Uint32Array | Uint16Array;
    const idxBuffer = idxArr.buffer as ArrayBuffer;
    // mergeGeometries downsizes the index to 16-bit when a group is small
    // enough, so the views must match its element size.
    const IndexCtor = idxArr.BYTES_PER_ELEMENT === 4 ? Uint32Array : Uint16Array;
    const stride = idxArr.BYTES_PER_ELEMENT;
    let tCursor = 0;
    for (const p of parts) {
      const i = this.partIndex.get(p.id)!;
      const pick = new THREE.BufferGeometry();
      pick.setAttribute('position', new THREE.BufferAttribute(pos.array as Float32Array, 3));
      pick.setIndex(
        new THREE.BufferAttribute(
          new IndexCtor(idxBuffer, idxArr.byteOffset + tCursor * stride, p.indexCount),
          1
        )
      );
      const sphere = new THREE.Sphere();
      this.bounds3[i].getBoundingSphere(sphere);
      pick.boundingSphere = sphere;
      pick.boundingBox = this.bounds3[i].clone();
      const mesh = new THREE.Mesh(pick);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);
      this.pickerMeshes[i] = mesh;
      this.pickerGeometries.push(pick);
      tCursor += p.indexCount;
    }
  }

  // ---------------------------------------------------------------- state --
  /** Tint used when a body system is emphasized. */
  setAccent(hex: string) {
    if (this.disposed) return;
    ACCENT.set(hex);
    this.dirty = true;
  }

  setState(next: EngineState) {
    if (this.disposed) return;
    const prev = this.state;
    this.state = next;
    if (!this.atlas) return;

    // Load whatever chunks the current visibility needs. Cheap enough to run
    // on every call; ensureChunks is a no-op when nothing is missing.
    const needed = new Set<number>();
    this.atlas.parts.forEach((p) => {
      if (next.visible.includes(p.system) || next.selected.includes(p.id)) needed.add(p.chunk);
    });
    const missing = [...needed].filter((c) => !this.loadedChunks.has(c));
    if (missing.length) void this.ensureChunks([...needed].sort((a, b) => a - b));

    this.refreshState();

    // Pull the camera back as the body explodes apart.
    if (prev && prev.explode !== next.explode && !next.isolate) {
      if (next.explode > 0.4) this.ensureLayout();
      this.fit(next.view, next.explode);
    }

    if (next.reset !== this.lastReset) {
      this.lastReset = next.reset;
      this.amount = 0;
      this.fit(next.view, 0);
    } else if (next.view !== this.lastView) {
      this.lastView = next.view;
      this.fit(next.view, this.amount);
    }
    if (next.focus !== this.lastFocus) {
      this.lastFocus = next.focus;
      if (next.selected.length) this.frameSelection();
    } else if (prev && prev.isolate !== next.isolate && next.isolate && next.selected.length) {
      this.frameSelection();
    }
  }

  private visiblePartIndices(): number[] {
    const s = this.state;
    if (!s || !this.atlas) return [];
    const out: number[] = [];
    const vis = new Set(s.visible);
    const sel = new Set(s.selected);
    this.atlas.parts.forEach((p, i) => {
      if (s.isolate ? sel.has(p.id) : vis.has(p.system) || sel.has(p.id)) out.push(i);
    });
    return out;
  }

  /** Compute (or reuse) the inventory grid layout for the visible parts. */
  private ensureLayout(visibleIdx?: number[]) {
    if (!this.atlas) return;
    const idx = visibleIdx ?? this.visiblePartIndices();
    const aspect = Math.max(0.4, this.camera.aspect);
    const key = idx.join(',') + ':' + aspect.toFixed(3);
    if (key !== this.layoutKey) {
      this.layout = packInventory(idx.map((i) => this.atlas!.parts[i]), aspect);
      this.layoutKey = key;
    }
  }

  private refreshState() {
    const s = this.state;
    if (!s || !this.atlas) return;
    const vis = new Set(s.visible);
    const sel = new Set(s.selected);
    const isolate = s.isolate;
    const emphasis = new Set(s.emphasis ?? []);
    const emphasizing = emphasis.size > 0;
    const visibleIdx = this.visiblePartIndices();

    // Inventory layout for the exploded view.
    if (this.amount > 0.45) this.ensureLayout(visibleIdx);

    const nSys = SYSTEM_META.length;
    const data = this.stateData;
    const selData = this.selData;
    for (let i = 0; i < this.atlas.parts.length; i++) {
      const p = this.atlas.parts[i];
      const visible = isolate ? sel.has(p.id) : vis.has(p.system) || sel.has(p.id);
      const c = this.centers[i];
      let dx = 0, dy = 0, dz = 0;
      if (this.amount > 0.0005 && !isolate) {
        const group = this.systemOrder.get(p.system) ?? 0;
        const angle = (group / nSys) * Math.PI * 2;
        const fanX = Math.sin(angle) * FAN_RADIUS;
        const fanZ = Math.cos(angle) * FAN_RADIUS;
        const fanY = (c.y - STAGE_Y) * 0.3;
        if (this.amount <= 0.45) {
          const t = this.amount / 0.45;
          dx = fanX * t; dy = fanY * t; dz = fanZ * t;
        } else {
          const t = (this.amount - 0.45) / 0.55;
          const cell = this.layout?.cells.get(p.id);
          const gx = cell ? cell.x - c.x : 0;
          const gy = cell ? cell.y + STAGE_Y - c.y : 0;
          const gz = cell ? -c.z : 0;
          dx = THREE.MathUtils.lerp(fanX, gx, t);
          dy = THREE.MathUtils.lerp(fanY, gy, t);
          dz = THREE.MathUtils.lerp(fanZ, gz, t);
        }
      }
      const o = i * 4;
      data[o] = dx; data[o + 1] = dy; data[o + 2] = dz; data[o + 3] = visible ? 1 : 0;
      const focused = emphasizing && emphasis.has(p.system);
      selData[o] = sel.has(p.id) || focused ? 255 : this.hoverIndex === i ? 140 : 0;
      const mesh = this.pickerMeshes[i];
      if (mesh) {
        mesh.position.set(dx, dy, dz);
        mesh.updateMatrix();
        mesh.updateMatrixWorld(true);
      }
    }
    this.stateTexture.needsUpdate = true;
    this.selTexture.needsUpdate = true;

    this.materials.forEach((mat, system) => {
      const focused = !emphasizing || emphasis.has(system as SystemId);
      const ghost = emphasizing && !focused && system !== "integumentary";
      const nextOpacity = system === "integumentary" ? 0.13 : ghost ? 0.16 : 1;
      const nextTransparent = system === "integumentary" || ghost;
      if (mat.opacity !== nextOpacity || mat.transparent !== nextTransparent) {
        mat.opacity = nextOpacity;
        mat.transparent = nextTransparent;
        mat.depthWrite = system !== "integumentary" && !ghost;
        mat.needsUpdate = true;
      }
    });

    // Grid view trades orbit for pan so the inventory can be browsed.
    const grid = this.amount > 0.8 && !isolate;
    this.controls.enableRotate = !grid;
    this.controls.mouseButtons.LEFT = grid ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
    this.controls.touches.ONE = grid ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
    this.controls.autoRotate = !!s.autoRotate && !isolate && this.amount < 0.4;
    this.stage.visible = this.amount < 0.5 && !isolate;
    this.dirty = true;
  }

  // -------------------------------------------------------------- camera --
  private fit(view: ViewId, extent: number) {
    if (extent > 0.4) this.ensureLayout();
    const el = this.renderer.domElement;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    const aspect = w / h;
    const fov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const normalDistance = Math.max(2.6, (h / Math.max(160, h - 260)) * 3.1);
    const packW = this.layout?.width ?? 0.6;
    const packH = this.layout?.height ?? 1.7;
    const atlasDistance =
      Math.max(packH, packW / Math.max(0.4, aspect)) / (2 * Math.tan(fov)) * 1.18;
    const distance = THREE.MathUtils.lerp(normalDistance, Math.max(0.3, atlasDistance), extent);
    const dir =
      extent > 0.6 || view === 'front' ? new THREE.Vector3(0, 0.03, 1)
      : view === 'back' ? new THREE.Vector3(0, 0.03, -1)
      : view === 'side' ? new THREE.Vector3(1, 0.03, 0)
      : new THREE.Vector3(0.42, 0.1, 1).normalize();
    const targetY = STAGE_Y;
    this.tweenTo(targetY, dir, distance);
  }

  private tweenTo(targetY: number, dir: THREE.Vector3, distance: number) {
    const target = new THREE.Vector3(0, targetY, 0);
    const pos = target.clone().addScaledVector(dir, distance);
    this.tween = {
      fromPos: this.camera.position.clone(),
      toPos: pos,
      fromTarget: this.controls.target.clone(),
      toTarget: target,
      t: 0,
      dur: 0.65,
    };
  }

  frameSelection() {
    const s = this.state;
    if (!s || !s.selected.length || !this.atlas) return;
    const box = new THREE.Box3();
    s.selected.forEach((id) => {
      const i = this.partIndex.get(id);
      if (i === undefined) return;
      const b = this.bounds3[i].clone();
      const o = this.stateData;
      b.translate(new THREE.Vector3(o[i * 4], o[i * 4 + 1], o[i * 4 + 2]));
      box.union(b);
    });
    if (box.isEmpty()) return;
    this.frameBox(box, 1.25);
  }

  frameVisible() {
    const box = new THREE.Box3();
    this.visiblePartIndices().forEach((i) => box.union(this.bounds3[i]));
    if (box.isEmpty()) return;
    this.frameBox(box, 1.12);
  }

  private frameBox(box: THREE.Box3, margin: number) {
    const el = this.renderer.domElement;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const fov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const distance =
      Math.max(size.y, size.x / Math.max(0.4, w / h), size.z * 0.7) / (2 * Math.tan(fov)) * margin;
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    if (!Number.isFinite(dir.length()) || dir.length() < 0.01) dir.set(0.42, 0.1, 1).normalize();
    this.tween = {
      fromPos: this.camera.position.clone(),
      toPos: center.clone().addScaledVector(dir, Math.max(0.08, distance)),
      fromTarget: this.controls.target.clone(),
      toTarget: center,
      t: 0,
      dur: 0.8,
    };
  }

  // ------------------------------------------------------------- picking --
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private worldBox = new THREE.Box3();
  private hitPoint = new THREE.Vector3();

  private pickAt(clientX: number, clientY: number): number {
    if (!this.atlas) return -1;
    const el = this.renderer.domElement;
    const rect = el.getBoundingClientRect();
    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const visibleIdx = new Set(this.visiblePartIndices());
    const hasSolid = [...visibleIdx].some(
      (i) => this.atlas!.parts[i].system !== 'integumentary'
    );
    let best = -1;
    let bestDist = Infinity;
    this.pickerMeshes.forEach((mesh, i) => {
      if (!mesh || !visibleIdx.has(i)) return;
      const p = this.atlas!.parts[i];
      if (p.system === 'integumentary' && hasSolid) return;
      const o = this.stateData;
      this.worldBox.copy(this.bounds3[i]).translate(new THREE.Vector3(o[i * 4], o[i * 4 + 1], o[i * 4 + 2]));
      if (!this.raycaster.ray.intersectBox(this.worldBox, this.hitPoint)) return;
      const hits = this.raycaster.intersectObject(mesh, false);
      if (hits.length && hits[0].distance < bestDist) {
        bestDist = hits[0].distance;
        best = i;
      }
    });
    return best;
  }

  private onPointerDown = (e: PointerEvent) => {
    this.tap = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      drag: false,
      threshold: e.pointerType === 'touch' ? 12 : 6,
    };
    this.cb.onHover(null);
    this.dirty = true;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.tap) {
      if (
        this.tap.pointerId === e.pointerId &&
        Math.hypot(e.clientX - this.tap.x, e.clientY - this.tap.y) > this.tap.threshold
      ) {
        this.tap.drag = true;
      }
      return;
    }
    if (e.pointerType === 'touch' || e.buttons) return;
    const now = performance.now();
    if (now - this.hoverThrottle < 60) return;
    this.hoverThrottle = now;
    const i = this.pickAt(e.clientX, e.clientY);
    if (i !== this.hoverIndex) {
      this.hoverIndex = i;
      this.refreshState();
      this.renderer.domElement.style.cursor = i >= 0 ? 'pointer' : 'grab';
    }
    if (i >= 0 && this.atlas) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.cb.onHover({
        id: this.atlas.parts[i].id,
        name: this.atlas.parts[i].name,
        system: this.atlas.parts[i].system,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else {
      this.cb.onHover(null);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const tap = this.tap;
    this.tap = null;
    if (!tap || tap.drag || tap.pointerId !== e.pointerId) return;
    const i = this.pickAt(e.clientX, e.clientY);
    const id = i >= 0 && this.atlas ? this.atlas.parts[i].id : null;
    const now = performance.now();
    if (id && id === this.lastClick.id && now - this.lastClick.t < 400) {
      this.lastClick = { id: '', t: 0 };
      this.cb.onActivate(id);
    } else {
      this.lastClick = { id: id ?? '', t: now };
      this.cb.onPick(id, i >= 0 && this.atlas ? this.atlas.parts[i].system : undefined);
    }
  };

  private onPointerCancel = () => {
    this.tap = null;
  };

  private onPointerLeave = () => {
    this.tap = null;
    if (this.hoverIndex >= 0) {
      this.hoverIndex = -1;
      this.refreshState();
    }
    this.cb.onHover(null);
  };

  // ------------------------------------------------------------- lifecycle --
  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.dirty = true;
  }

  private resizeObserver?: ResizeObserver;

  attachResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      this.layoutKey = ''; // repack for the new aspect
      if (this.state) this.refreshState();
    });
    this.resizeObserver.observe(this.host);
  }

  private animate = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    if (this.state && Math.abs(this.amount - this.state.explode) > 0.0005) {
      this.amount = THREE.MathUtils.damp(this.amount, this.state.explode, 7, dt);
      this.refreshState();
    }
    if (this.tween) {
      this.tween.t = Math.min(1, this.tween.t + dt / this.tween.dur);
      const e = 1 - Math.pow(1 - this.tween.t, 3); // ease-out cubic
      this.camera.position.lerpVectors(this.tween.fromPos, this.tween.toPos, e);
      this.controls.target.lerpVectors(this.tween.fromTarget, this.tween.toTarget, e);
      if (this.tween.t >= 1) this.tween = null;
      this.dirty = true;
    }
    this.controls.update();
    if (this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointercancel', this.onPointerCancel);
    el.removeEventListener('pointerleave', this.onPointerLeave);
    this.controls.dispose();
    this.teardownAtlas();
    this.stateTexture?.dispose();
    this.selTexture?.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m.dispose());
      }
    });
    this.renderer.dispose();
    el.remove();
  }
}
