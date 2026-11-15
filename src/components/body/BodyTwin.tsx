import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { StatusLevel } from "../../data/vitalsData";
import type { Intelligence } from "../../ai/engine";
import { useSettingsStore } from "../../stores/settingsStore";

/**
 * "Body twin" — AURA's built-in 3D body.
 *
 * A lightweight procedural figure (no downloads, ~one frame to start) whose four
 * systems light up from the AI analysis: colour and glow follow each system's
 * finding, the heart beats at the actual resting heart rate, and callouts are
 * pinned to the anatomy. It is the always-available 3D view; the full Human-Atlas
 * models in the Body view are the detailed one.
 */

const SYSTEMS = ["cardiovascular", "skeletal", "nervous", "immune"] as const;
type SystemKey = (typeof SYSTEMS)[number];

const BASE: Record<SystemKey, string> = {
  cardiovascular: "#e07b6b",
  skeletal: "#e4d8bd",
  nervous: "#9fb0e8",
  immune: "#7fd6ae",
};
const LEVEL: Record<StatusLevel, string> = {
  normal: "",
  watch: "#f0b04a",
  act: "#ef6a4f",
  emergency: "#ff3b3b",
};
const GLOW: Record<StatusLevel, number> = { normal: 0.3, watch: 0.62, act: 0.95, emergency: 1.2 };

/** Where each system's callout is pinned, in body space (metres, y up). */
const ANCHORS: Record<SystemKey, [number, number, number]> = {
  cardiovascular: [0.04, 1.34, 0.07],
  nervous: [0, 1.74, 0.02],
  skeletal: [0.1, 0.62, 0.06],
  immune: [-0.05, 0.86, 0.08],
};

import { systemCallouts, type Callout } from "./callouts";

function glass(color: string) {
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity: 0.1,
    roughness: 0.4,
    metalness: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function build(callouts: Record<string, Callout>) {
  const root = new THREE.Group();
  const shell = new THREE.Group();
  const sys: Record<SystemKey, THREE.Group> = {
    cardiovascular: new THREE.Group(),
    skeletal: new THREE.Group(),
    nervous: new THREE.Group(),
    immune: new THREE.Group(),
  };
  const mats: Record<SystemKey, THREE.MeshStandardMaterial> = {} as never;
  for (const k of SYSTEMS) {
    const lvl = callouts[k]?.level ?? "normal";
    const tint = new THREE.Color(BASE[k]);
    if (LEVEL[lvl]) tint.lerp(new THREE.Color(LEVEL[lvl]), lvl === "watch" ? 0.35 : 0.65);
    mats[k] = new THREE.MeshStandardMaterial({
      color: tint,
      emissive: tint,
      emissiveIntensity: GLOW[lvl],
      roughness: 0.45,
      metalness: 0.05,
    });
    sys[k].userData.system = k;
  }
  const skin = glass("#bfe8cf");
  const skinLine = new THREE.MeshBasicMaterial({ color: "#8fd3ad", wireframe: true, transparent: true, opacity: 0.1, depthWrite: false });

  const skinPart = (geo: THREE.BufferGeometry, pos: [number, number, number], scale: [number, number, number] = [1, 1, 1], rot: [number, number, number] = [0, 0, 0]) => {
    for (const mat of [skin, skinLine]) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      m.scale.set(...scale);
      m.rotation.set(...rot);
      shell.add(m);
    }
  };
  const cap = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 6, 18);
  skinPart(new THREE.SphereGeometry(0.105, 24, 18), [0, 1.69, 0], [0.92, 1.12, 1]);
  skinPart(cap(0.045, 0.07), [0, 1.55, 0]);
  skinPart(cap(0.15, 0.26), [0, 1.27, 0], [1.2, 1, 0.72]);
  skinPart(cap(0.125, 0.14), [0, 1.02, 0], [1.1, 1, 0.75]);
  skinPart(new THREE.SphereGeometry(0.15, 20, 14), [0, 0.88, 0], [1.1, 0.75, 0.8]);
  for (const s of [-1, 1]) {
    skinPart(cap(0.045, 0.25), [s * 0.235, 1.37, 0], [1, 1, 1], [0, 0, s * 0.09]);
    skinPart(cap(0.037, 0.24), [s * 0.275, 1.08, 0.01], [1, 1, 1], [0, 0, s * 0.05]);
    skinPart(new THREE.SphereGeometry(0.035, 12, 10), [s * 0.29, 0.91, 0.01]);
    skinPart(cap(0.077, 0.36), [s * 0.09, 0.63, 0], [1, 1, 1], [0, 0, s * -0.02]);
    skinPart(cap(0.055, 0.36), [s * 0.1, 0.25, 0]);
    skinPart(new THREE.BoxGeometry(0.07, 0.04, 0.15), [s * 0.1, 0.03, 0.04]);
  }
  root.add(shell);

  const solid = (geo: THREE.BufferGeometry, k: SystemKey, pos: [number, number, number], scale: [number, number, number] = [1, 1, 1], rot: [number, number, number] = [0, 0, 0]) => {
    const m = new THREE.Mesh(geo, mats[k]);
    m.position.set(...pos);
    m.scale.set(...scale);
    m.rotation.set(...rot);
    sys[k].add(m);
    return m;
  };
  const tube = (pts: THREE.Vector3[], r: number, k: SystemKey) => {
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 6, false), mats[k]);
    sys[k].add(m);
  };

  /* Cardiovascular: heart + major vessels. */
  const heart = solid(new THREE.IcosahedronGeometry(0.052, 2), "cardiovascular", [0.035, 1.33, 0.05], [1, 1.15, 0.95], [0, 0, -0.3]);
  const v3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
  tube([v3(0.02, 1.37, 0.04), v3(0, 1.45, 0.03), v3(-0.04, 1.44, 0), v3(-0.045, 1.3, -0.02), v3(-0.03, 1.05, -0.02), v3(-0.02, 0.9, 0)], 0.012, "cardiovascular");
  tube([v3(-0.02, 0.9, 0), v3(-0.07, 0.75, 0), v3(-0.09, 0.5, 0), v3(-0.1, 0.1, 0.02)], 0.01, "cardiovascular");
  tube([v3(-0.02, 0.9, 0), v3(0.05, 0.75, 0), v3(0.09, 0.5, 0), v3(0.1, 0.1, 0.02)], 0.01, "cardiovascular");
  tube([v3(-0.02, 1.44, 0), v3(-0.16, 1.43, 0), v3(-0.25, 1.3, 0), v3(-0.28, 1.0, 0.01)], 0.008, "cardiovascular");
  tube([v3(0.0, 1.45, 0), v3(0.16, 1.43, 0), v3(0.25, 1.3, 0), v3(0.28, 1.0, 0.01)], 0.008, "cardiovascular");
  tube([v3(0, 1.45, 0), v3(0, 1.58, 0.01), v3(0.01, 1.68, 0.03)], 0.007, "cardiovascular");

  /* Skeletal. */
  solid(new THREE.SphereGeometry(0.085, 20, 14), "skeletal", [0, 1.69, 0], [0.9, 1.1, 1]);
  solid(new THREE.BoxGeometry(0.07, 0.03, 0.06), "skeletal", [0, 1.6, 0.02]);
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const y = 1.55 - t * 0.7;
    const z = -0.045 - Math.sin(t * Math.PI * 2) * 0.012;
    solid(new THREE.BoxGeometry(0.036, 0.024, 0.032), "skeletal", [0, y, z]);
  }
  for (let i = 0; i < 7; i++) {
    const y = 1.46 - i * 0.04;
    const w = 0.115 + Math.sin((i / 6) * Math.PI) * 0.045 - i * 0.004;
    solid(new THREE.TorusGeometry(w, 0.006, 6, 28, Math.PI * 1.7), "skeletal", [0, y, 0.005], [1, 1, 0.62], [Math.PI / 2 + 0.15, 0, Math.PI * 0.65]);
  }
  solid(new THREE.TorusGeometry(0.1, 0.014, 8, 26), "skeletal", [0, 0.88, 0], [1.1, 1, 0.8], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) {
    solid(new THREE.CylinderGeometry(0.014, 0.012, 0.27, 8), "skeletal", [s * 0.235, 1.37, 0], [1, 1, 1], [0, 0, s * 0.09]);
    solid(new THREE.CylinderGeometry(0.011, 0.009, 0.25, 8), "skeletal", [s * 0.275, 1.08, 0.01], [1, 1, 1], [0, 0, s * 0.05]);
    solid(new THREE.CylinderGeometry(0.02, 0.016, 0.4, 8), "skeletal", [s * 0.09, 0.63, 0], [1, 1, 1], [0, 0, s * -0.02]);
    solid(new THREE.CylinderGeometry(0.015, 0.012, 0.4, 8), "skeletal", [s * 0.1, 0.25, 0]);
    solid(new THREE.SphereGeometry(0.026, 10, 8), "skeletal", [s * 0.095, 0.43, 0.01]);
  }

  /* Nervous. */
  solid(new THREE.SphereGeometry(0.068, 20, 14), "nervous", [0, 1.71, 0.005], [1.05, 0.85, 1.12]);
  tube([v3(0, 1.64, -0.02), v3(0, 1.5, -0.045), v3(0, 1.2, -0.055), v3(0, 0.9, -0.04)], 0.007, "nervous");
  for (const s of [-1, 1]) {
    tube([v3(0, 1.4, -0.05), v3(s * 0.12, 1.4, -0.03), v3(s * 0.24, 1.3, 0), v3(s * 0.28, 1.04, 0.015)], 0.0045, "nervous");
    tube([v3(0, 0.9, -0.04), v3(s * 0.07, 0.7, -0.01), v3(s * 0.1, 0.4, 0.02), v3(s * 0.1, 0.06, 0.04)], 0.0045, "nervous");
  }

  /* Immune / lymphatic nodes. */
  const nodes: [number, number, number][] = [
    [0.05, 1.56, 0.05], [-0.05, 1.56, 0.05], [0.19, 1.4, 0.03], [-0.19, 1.4, 0.03],
    [0.05, 0.84, 0.08], [-0.05, 0.84, 0.08], [0, 1.15, 0.07], [0.1, 0.48, -0.06], [-0.1, 0.48, -0.06],
  ];
  for (const p of nodes) solid(new THREE.SphereGeometry(0.014, 10, 8), "immune", p);
  tube([v3(0.05, 1.56, 0.05), v3(0.12, 1.47, 0.04), v3(0.19, 1.4, 0.03)], 0.003, "immune");
  tube([v3(-0.05, 1.56, 0.05), v3(-0.12, 1.47, 0.04), v3(-0.19, 1.4, 0.03)], 0.003, "immune");
  tube([v3(0, 1.15, 0.07), v3(0.03, 1, 0.08), v3(0.05, 0.84, 0.08)], 0.003, "immune");

  for (const k of SYSTEMS) root.add(sys[k]);
  return { root, sys, mats, heart };
}

type Props = {
  intel: Intelligence;
  heartRate?: number;
  activeSystemId?: string | null;
  onSelectSystem?: (id: string) => void;
  /** Allow scroll-zoom (off on pages that scroll). */
  zoom?: boolean;
  /** Pinned callouts next to the anatomy. */
  labels?: boolean;
  className?: string;
};

export default function BodyTwin({ intel, heartRate = 64, activeSystemId = null, onSelectSystem, zoom = false, labels = true, className = "" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const callouts = systemCallouts(intel);
  const calloutsRef = useRef(callouts);
  calloutsRef.current = callouts;
  const activeRef = useRef<string | null>(activeSystemId);
  activeRef.current = activeSystemId;
  const hoverRef = useRef<string | null>(null);
  hoverRef.current = hovered;
  const selectRef = useRef(onSelectSystem);
  selectRef.current = onSelectSystem;
  const hrRef = useRef(heartRate);
  hrRef.current = heartRate;
  const motionRef = useRef(animationsEnabled);
  motionRef.current = animationsEnabled;
  const key = JSON.stringify(Object.entries(callouts).map(([k, v]) => [k, v.level]));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "pan-y";
    host.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(0.9, 1.25, 3.6);
    scene.add(new THREE.AmbientLight("#bcd9cf", 0.7));
    const key1 = new THREE.DirectionalLight("#ffffff", 1.3);
    key1.position.set(2, 3, 3);
    scene.add(key1);
    const rim = new THREE.DirectionalLight("#7fd6ae", 1.1);
    rim.position.set(-3, 2, -2);
    scene.add(rim);

    const { root, sys, mats, heart } = build(calloutsRef.current);
    scene.add(root);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.95, 0);
    controls.enablePan = false;
    controls.enableZoom = zoom;
    controls.minDistance = 1.6;
    controls.maxDistance = 5;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.enableDamping = true;
    controls.autoRotateSpeed = 0.9;
    controls.update();

    const size = () => {
      const w = host.clientWidth || 300;
      const h = host.clientHeight || 400;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      // Keep the whole body in frame on tall and wide hosts.
      camera.position.setLength(camera.aspect < 0.8 ? 4.5 : 3.7);
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);

    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pick = (e: PointerEvent): SystemKey | null => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(SYSTEMS.map((k) => sys[k]), true)[0];
      let o: THREE.Object3D | null = hit?.object ?? null;
      while (o && !o.userData.system) o = o.parent;
      return (o?.userData.system as SystemKey) ?? null;
    };
    let down: { x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const k = pick(e);
      renderer.domElement.style.cursor = k ? "pointer" : "grab";
      if (k !== hoverRef.current) setHovered(k);
    };
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
        const k = pick(e);
        if (k) selectRef.current?.(k);
      }
      down = null;
    };
    const onLeave = () => setHovered(null);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(host);

    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    const centre = new THREE.Vector3(0, 0.95, 0);
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.visibilityState !== "visible") return;
      const t = clock.getElapsedTime();
      const motion = motionRef.current;
      controls.autoRotate = motion && !hoverRef.current && !activeRef.current;
      controls.update();

      // The heart beats at the real resting rate: a quick lub-dub per cycle.
      const period = 60 / Math.max(40, hrRef.current);
      const phase = (t % period) / period;
      const beat = motion ? Math.max(0, Math.sin(phase * Math.PI * 2 * 1) ** 12) * 0.22 + Math.max(0, Math.sin((phase - 0.18) * Math.PI * 2)) ** 14 * 0.1 : 0;
      heart.scale.set(1 + beat, 1.15 + beat, 0.95 + beat);

      const focus = hoverRef.current ?? activeRef.current;
      for (const k of SYSTEMS) {
        const lvl = calloutsRef.current[k]?.level ?? "normal";
        const base = GLOW[lvl];
        const pulse = motion && lvl !== "normal" ? 0.18 * Math.sin(t * 2.4) : 0;
        const dim = focus && focus !== k ? 0.35 : 1;
        mats[k].emissiveIntensity = (base + pulse + (focus === k ? 0.5 : 0)) * dim;
        mats[k].opacity = 1;
      }

      if (labels) {
        const w = host.clientWidth;
        const h = host.clientHeight;
        const camDist = camera.position.distanceTo(centre);
        for (const k of SYSTEMS) {
          const el = labelRefs.current[k];
          if (!el) continue;
          tmp.set(...ANCHORS[k]).applyMatrix4(root.matrixWorld);
          const behind = tmp.distanceTo(camera.position) > camDist + 0.06;
          tmp.project(camera);
          el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
          el.style.opacity = behind ? "0.22" : focus && focus !== k ? "0.55" : "1";
        }
      }
      renderer.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
      });
      for (const k of SYSTEMS) mats[k].dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // Rebuild only when the findings' levels change; everything else flows through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, zoom, labels]);

  if (failed) {
    return (
      <div className={`twin twin-failed ${className}`}>
        <p>3D isn’t available in this browser (WebGL is off). The findings are listed beside this view.</p>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={`twin ${className}`}
      role="img"
      aria-label={`3D body twin. ${Object.values(callouts).map((c) => `${c.title}: ${c.text}`).join(". ")}`}
    >
      {labels &&
        SYSTEMS.map((k) => {
          const c = callouts[k];
          if (!c) return null;
          return (
            <button
              key={k}
              ref={(el) => {
                labelRefs.current[k] = el;
              }}
              type="button"
              className={`twin-label sys-${k} lvl-${c.level} ${k === "immune" ? "side-l" : "side-r"} ${activeSystemId === k || hovered === k ? "is-on" : ""}`}
              onClick={() => onSelectSystem?.(k)}
              onMouseEnter={() => setHovered(k)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(k)}
              onBlur={() => setHovered(null)}
            >
              <i aria-hidden="true" />
              <span>
                <b>{c.title}</b>
                <em>{c.text}</em>
              </span>
            </button>
          );
        })}
    </div>
  );
}
