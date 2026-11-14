/** Types and metadata for the Human-Atlas binary model format.
 *
 * Each atlas is a JSON manifest plus a set of binary chunk files. A chunk is a
 * flat byte stream of per-structure blocks, each 4-byte aligned:
 *
 *   [ float32 x3 positions | int16 x3 normals (unit * 32767) | uint32 indices ]
 *
 * The manifest records, for every structure, the byte offsets of its three
 * arrays inside its chunk, so geometry can be mounted as zero-copy typed-array
 * views over one decompressed ArrayBuffer.
 */

export type SystemId =
  | 'skeletal' | 'muscular' | 'cardiac' | 'sensory' | 'arterial' | 'venous'
  | 'nervous' | 'brain' | 'respiratory' | 'digestive' | 'urinary' | 'lymphatic'
  | 'endocrine' | 'reproductive' | 'integumentary' | 'connective'
  | 'pregnancy' | 'borrowed' | 'donor-muscle';

export interface Part {
  id: string;
  name: string;
  conceptId: string;
  system: SystemId;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: [number[], number[]];
}

export interface Concept {
  id: string;
  name: string;
  elements: string[];
}

export interface ChunkRef {
  url: string;
  bytes: number;
  gzip: string;
  gzipBytes: number;
}

export interface AtlasManifest {
  version: string;
  sex?: string;
  source?: string;
  scope?: string;
  parts: Part[];
  concepts: Concept[];
  chunks: ChunkRef[];
  triangles: number;
  sourceTriangles?: number;
  borrowed?: unknown;
  donorMuscle?: unknown;
}

export interface SystemMeta {
  id: SystemId;
  name: string;
  color: string;
  blurb: string;
}

/** Display metadata for every system that appears in either atlas.
 * Colors are picked for a dark stage; each is distinct at a glance. */
export const SYSTEM_META: SystemMeta[] = [
  { id: 'skeletal', name: 'Skeletal', color: '#d8cbb0', blurb: 'Bones — the supporting framework of the body, protecting organs and anchoring muscles.' },
  { id: 'muscular', name: 'Muscular', color: '#c4705e', blurb: 'Skeletal muscles move joints, stabilise posture, and produce heat.' },
  { id: 'cardiac', name: 'Cardiac', color: '#d96b60', blurb: 'The four-chambered muscular pump driving the pulmonary and systemic circuits.' },
  { id: 'sensory', name: 'Sensory organs', color: '#8fb8ae', blurb: 'Structures of sight, hearing, and balance.' },
  { id: 'arterial', name: 'Arterial', color: '#cd5c4d', blurb: 'Vessels carrying blood away from the heart.' },
  { id: 'venous', name: 'Venous', color: '#4e9187', blurb: 'Vessels returning blood toward the heart.' },
  { id: 'nervous', name: 'Nervous', color: '#d7b45f', blurb: 'Brain, spinal cord, and peripheral nerves carrying signals.' },
  { id: 'brain', name: 'Brain regions', color: '#b3a7c9', blurb: 'Individually selectable regions of the brain.' },
  { id: 'respiratory', name: 'Respiratory', color: '#c98f97', blurb: 'The airways and lungs, where gases exchange with blood.' },
  { id: 'digestive', name: 'Digestive', color: '#c99a6e', blurb: 'The digestive tract and its accessory organs.' },
  { id: 'urinary', name: 'Urinary', color: '#c08567', blurb: 'Kidneys, ureters, and bladder filtering and draining urine.' },
  { id: 'lymphatic', name: 'Lymphatic', color: '#8fae83', blurb: 'Vessels and nodes returning tissue fluid and screening for threats.' },
  { id: 'endocrine', name: 'Endocrine', color: '#c9a09a', blurb: 'Glands releasing hormones into the bloodstream.' },
  { id: 'reproductive', name: 'Reproductive', color: '#c4a194', blurb: 'Structures producing gametes and sex hormones.' },
  { id: 'integumentary', name: 'Body surface', color: '#baa389', blurb: 'The skin and surface soft tissue — shown as a translucent shell.' },
  { id: 'connective', name: 'Connective tissue', color: '#a3c0b6', blurb: 'Cartilage, ligaments, and joint soft tissue.' },
  { id: 'pregnancy', name: 'Pregnancy', color: '#d3a5a5', blurb: 'Placenta and umbilical structures from a pregnancy reference.' },
  { id: 'borrowed', name: 'Male-derived bones', color: '#96a3ad', blurb: 'Bones the female source does not model, copied from the male reference and fitted to shared landmarks. A labelled placeholder, not female anatomy.' },
  { id: 'donor-muscle', name: 'Leg muscles (donor)', color: '#b3826c', blurb: 'Hip, thigh, and calf muscles from the Visible Human Female — a second woman’s anatomy, fitted to this body’s leg bones.' },
];

export const SYSTEM_MAP: Record<string, SystemMeta> = Object.fromEntries(
  SYSTEM_META.map((s) => [s.id, s])
);

export const ALL_SYSTEM_IDS: SystemId[] = SYSTEM_META.map((s) => s.id);

/** The three model sets shipped in public/models. */
export type ModelId = 'male' | 'female' | 'muscles';

export interface ModelDef {
  id: ModelId;
  label: string;
  dataset: string;
  credit: string;
  manifest: string;
  /** Systems switched on when the model opens. */
  visible: SystemId[];
  /** Systems that exist in this model but start hidden (still listed). */
  hidden: SystemId[];
  /** Frame the visible parts on load instead of using the standing pose. */
  frameOnLoad?: boolean;
  tag: string;
}

const CORE_SYSTEMS: SystemId[] = [
  'skeletal', 'muscular', 'cardiac', 'sensory', 'arterial', 'venous', 'nervous',
  'brain', 'respiratory', 'digestive', 'urinary', 'lymphatic', 'endocrine',
  'reproductive', 'connective', 'integumentary',
];

export const MODELS: ModelDef[] = [
  {
    id: 'male',
    label: 'Male body',
    dataset: 'BodyParts3D 4.0',
    credit: 'BodyParts3D © The Database Center for Life Science (CC BY 4.0)',
    manifest: '/models/atlas.json',
    visible: CORE_SYSTEMS.filter((s) => s !== 'reproductive' && s !== 'integumentary'),
    hidden: ['reproductive', 'integumentary'],
    tag: '2,234 meshes',
  },
  {
    id: 'female',
    label: 'Female body',
    dataset: 'Human Reference Atlas v1.10',
    credit: 'Browne & Schlehlein, HuBMAP Human Reference Atlas (CC BY 4.0)',
    manifest: '/models/atlas-female.json',
    visible: CORE_SYSTEMS.filter((s) => s !== 'reproductive'),
    hidden: ['reproductive', 'pregnancy', 'borrowed', 'donor-muscle'],
    tag: '1,220 meshes',
  },
  {
    id: 'muscles',
    label: 'Leg muscles',
    dataset: 'Visible Human Female · Andreassen et al. 2023',
    credit: 'Andreassen et al. 2023, Scientific Data (CC BY 4.0)',
    manifest: '/models/atlas-female.json',
    // Donor muscles occupy exactly female chunks 13-14, so this model streams
    // in ~4 MB. Switching skeletal on later lazily pulls the other chunks.
    visible: ['donor-muscle'],
    hidden: [],
    frameOnLoad: true,
    tag: '76 donor muscles',
  },
];

export const MODEL_MAP: Record<ModelId, ModelDef> = Object.fromEntries(
  MODELS.map((m) => [m.id, m])
) as Record<ModelId, ModelDef>;

/** Short human-written notes for widely known structures (display only). */
export const STRUCTURE_NOTES: Record<string, string> = {
  heart: 'A muscular pump in the chest; its right side sends blood to the lungs, its left side to the whole body.',
  brain: 'The central organ of the nervous system, supporting perception, movement, memory, and language.',
  liver: 'A large gland under the right diaphragm that processes nutrients, makes bile, and synthesises blood proteins.',
  lungs: 'The paired organs of gas exchange between air and blood.',
  stomach: 'A muscular chamber that stores and mixes food with acid and enzymes.',
  kidney: 'A paired filter of blood, balancing water, salts, and acidity while producing urine.',
  skin: 'The body’s protective outer barrier, sensing touch and temperature.',
  uterus: 'The muscular pelvic organ that houses and nourishes a developing fetus.',
  femur: 'The thigh bone — the longest bone in the body, from hip socket to knee.',
  aorta: 'The largest artery, carrying oxygenated blood from the heart to the body.',
  spleen: 'A lymphoid organ in the upper left abdomen that filters blood and supports immunity.',
  pancreas: 'An abdominal organ with digestive and hormonal roles, including insulin release.',
  'urinary bladder': 'The muscular reservoir storing urine from the kidneys.',
  'spinal cord': 'The nerve cord inside the vertebral canal, linking brain and body.',
};
