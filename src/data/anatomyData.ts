export interface AnatomySystem {
  id: string;
  name: string;
  color: string;
  description: string;
  spaceEffects: string[];
  parts: AnatomyPart[];
}

export interface AnatomyPart {
  id: string;
  name: string;
  position: [number, number, number]; // normalized 3D coords on body model
  description: string;
  spaceRelevance?: string;
}

export const ANATOMY_SYSTEMS: AnatomySystem[] = [
  {
    id: 'skeletal',
    name: 'Skeletal System',
    color: '#e8e4d8',
    description: 'The structural framework — 206 bones providing support, protection, and movement.',
    spaceEffects: [
      '1-2% bone mineral density loss per month in weight-bearing bones',
      'Increased fracture risk post-mission, especially femoral neck',
      'Calcium released from bones increases kidney stone risk',
      'Partial recovery takes 3-4 years after return to Earth',
    ],
    parts: [
      { id: 'skull', name: 'Cranium', position: [0, 3.62, -0.1], description: 'Protects the brain. Intracranial pressure increases in microgravity due to fluid shift.' },
      { id: 'mandible', name: 'Mandible', position: [0, 3.26, 0.06], description: 'The only movable bone of the skull, forming the lower jaw. Anchors the lower teeth and muscles of mastication.' },
      { id: 'spine', name: 'Vertebral Column', position: [0, 2.25, -0.23], description: 'Spinal elongation of 4-7cm occurs in microgravity, increasing herniation risk.', spaceRelevance: 'Astronauts grow taller in space as intervertebral discs expand without gravitational compression.' },
      { id: 'sternum', name: 'Sternum', position: [0, 2.63, 0.19], description: 'Flat central bone on the anterior chest wall. Connects the clavicles and costal cartilages to shield the heart and great vessels.' },
      { id: 'ribcage', name: 'Rib Cage', position: [0, 2.47, -0.04], description: 'Twelve pairs of curved bones and costal cartilages enclosing the thoracic organs. Expands and contracts during breathing.' },
      { id: 'clavicle', name: 'Clavicle', position: [0, 2.95, 0.02], description: 'S-shaped horizontal strut linking the sternum to the shoulder blade. Transmits forces from the upper limb to the axial skeleton.' },
      { id: 'scapula', name: 'Scapula', position: [0, 2.73, -0.23], description: 'Flat triangular bone on the upper back forming the shoulder socket. Provides broad attachment for shoulder-stabilizing muscles.' },
      { id: 'humerus', name: 'Humerus', position: [0, 2.42, -0.12], description: 'Single long bone of the upper arm from shoulder to elbow. Non-weight-bearing bones like this lose far less mineral density in space.', spaceRelevance: 'Upper-limb bones largely retain their mineral density in microgravity compared to the legs and pelvis.' },
      { id: 'forearm', name: 'Radius & Ulna', position: [0, 1.52, -0.13], description: 'Paired parallel bones of the lower arm enabling wrist rotation. Pronation and supination occur as one pivots across the other.' },
      { id: 'hand', name: 'Hand & Wrist', position: [0, 0.79, -0.09], description: 'Twenty-seven small carpals, metacarpals, and phalanges per side. Enables fine motor dexterity during pressurized glove work.', spaceRelevance: 'EVA spacesuit gloves place sustained strain on finger joints and fingernails.' },
      { id: 'pelvis', name: 'Pelvis', position: [0, 1.55, -0.12], description: 'Major weight-bearing structure. Significant density loss region.', spaceRelevance: 'One of the areas most affected by microgravity bone loss.' },
      { id: 'femur', name: 'Femur', position: [0, 0.83, -0.12], description: 'Longest bone. Proximal femur (hip) is a critical bone loss site.', spaceRelevance: 'Femoral neck fracture risk increases significantly after long-duration spaceflight.' },
      { id: 'patella', name: 'Patella', position: [0, 0.12, -0.01], description: 'Small triangular sesamoid bone embedded in the quadriceps tendon. Protects the knee joint and increases extensor leverage.' },
      { id: 'tibia-fibula', name: 'Tibia & Fibula', position: [0, -0.58, -0.12], description: 'Paired lower-leg bones carrying body weight from knee to ankle. Trabecular bone here remodels rapidly when mechanical loading stops.', spaceRelevance: 'High-resolution CT studies show lasting trabecular thinning in the distal tibia after long missions.' },
      { id: 'calcaneus', name: 'Calcaneus', position: [0, -1.34, -0.22], description: 'Heel bone — among the fastest bone density loss sites in microgravity.' },
      { id: 'foot', name: 'Foot & Ankle', position: [0, -1.28, 0.11], description: 'Tarsals, metatarsals, and phalanges forming the structural arches below the ankle. Loses daily ground-impact loading in orbit.' },
    ],
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular System',
    color: '#dc2626',
    description: 'Heart and blood vessels — pumping and circulating blood throughout the body.',
    spaceEffects: [
      'Cardiac output redistributes ~2L of fluid toward the head',
      'Heart becomes more spherical, losing ~9% of mass',
      'Orthostatic intolerance upon return to gravity',
      'Arterial stiffening observed in some astronauts',
    ],
    parts: [
      { id: 'heart', name: 'Heart', position: [-0.15, 2.6, 0.15], description: 'Muscular pump. Remodels to a more spherical shape in microgravity.', spaceRelevance: 'The heart adapts to reduced gravitational load, losing mass and becoming less efficient at pumping against gravity upon return.' },
      { id: 'aorta', name: 'Aorta', position: [0, 2.4, 0], description: 'Main artery from heart. Arterial stiffness may increase in space.' },
      { id: 'jugular', name: 'Jugular Veins', position: [0.15, 3.2, 0.1], description: 'Neck veins. Persistent distension in microgravity; blood clots have been found.', spaceRelevance: 'In 2019, an astronaut was found to have a blood clot in the jugular vein — the first discovered in space.' },
    ],
  },
  {
    id: 'muscular',
    name: 'Muscular System',
    color: '#b91c1c',
    description: 'Over 600 muscles enabling movement, posture, and vital functions.',
    spaceEffects: [
      'Up to 20% muscle mass loss in first month without countermeasures',
      'Postural muscles (back, calves) are most affected',
      'Strength decline of 10-30% in lower extremities',
      '2+ hours daily exercise required to mitigate loss',
    ],
    parts: [
      { id: 'facial', name: 'Facial & Mastication', position: [0, 3.55, 0.11], description: 'Muscles of expression and chewing around the eyes, mouth, forehead, and jaw. Cephalic fluid shift gives astronauts noticeable facial fullness early in flight.' },
      { id: 'sternocleidomastoid', name: 'Sternocleidomastoid', position: [0, 3.1, 0.03], description: 'Paired strap-like neck muscles running obliquely from behind the ear to the collarbone and sternum. Rotates and flexes the head and stabilizes gaze.' },
      { id: 'trapezius', name: 'Trapezius', position: [0, 2.68, -0.27], description: 'Broad diamond-shaped upper back muscle spanning from the skull base to the mid-spine and shoulder blades. Elevates and stabilizes the scapula during overhead tasks.' },
      { id: 'deltoid', name: 'Deltoid', position: [0, 2.71, -0.07], description: 'Rounded three-headed cap muscle covering the shoulder joint to abduct, flex, and extend the arm. Heavily recruited during EVA suit arm maneuvering.', spaceRelevance: 'Pressurized spacesuit shoulder bearings resist arm elevation, fatiguing the deltoids on spacewalks.' },
      { id: 'pectoralis', name: 'Pectoralis Major', position: [0, 2.68, 0.23], description: 'Thick fan-shaped anterior chest muscle that draws the arm across the body and rotates it inward. Preserved better than lower-body muscles through daily upper-body translation.' },
      { id: 'serratus', name: 'Serratus Anterior', position: [0, 2.4, 0.07], description: 'Saw-toothed muscle slips along the upper side of the rib cage that protract and stabilize the shoulder blade. Keeps the scapula anchored during pushing movements.' },
      { id: 'latissimus', name: 'Latissimus Dorsi', position: [0, 2.14, -0.24], description: 'Widest muscle of the back, sweeping from the lower spine and ribs up to the upper arm. Pulls the arm downward and backward during crew translation along handrails.' },
      { id: 'paraspinal', name: 'Paraspinal Muscles', position: [0, 2.33, -0.3], description: 'Support the spine. Atrophy contributes to back pain and herniation risk.', spaceRelevance: 'Back pain affects ~50% of astronauts, partly from paraspinal muscle deconditioning.' },
      { id: 'rectus-abdominis', name: 'Rectus Abdominis', position: [0, 1.91, 0.31], description: 'Segmented vertical strap muscle running down the front of the abdomen from ribs to pubic bone. Flexes the trunk and helps stabilize core posture.' },
      { id: 'obliques', name: 'External Obliques', position: [0, 2.04, 0.15], description: 'Broad diagonal flank muscles wrapping the sides of the torso to rotate and side-bend the trunk. Assist core stabilization without gravitational reference.' },
      { id: 'biceps', name: 'Biceps & Brachialis', position: [0, 2.4, 0.06], description: 'Anterior upper-arm flexors that bend the elbow and supinate the forearm. Used constantly for pulling along station handrails.' },
      { id: 'triceps', name: 'Triceps Brachii', position: [0, 2.47, -0.19], description: 'Three-headed posterior upper-arm muscle responsible for straightening the elbow. Balances flexor torque during precision tool handling.' },
      { id: 'forearm-muscles', name: 'Forearm & Hand', position: [0, 1.42, -0.1], description: 'Flexors, extensors, and hand tendons controlling wrist rotation and finger grip. Subjected to high endurance demands inside pressurized gloves.', spaceRelevance: 'Forearm flexor fatigue is one of the primary physical limiters during long EVA spacewalks.' },
      { id: 'gluteus', name: 'Gluteus Maximus', position: [0, 1.51, -0.34], description: 'Largest, outermost hip extensor forming the buttock and stabilizing upright posture. Loses volume rapidly when standing and stair-climbing disappear.' },
      { id: 'quadriceps', name: 'Quadriceps', position: [0, 0.71, 0.07], description: 'Anterior thigh. Significant volume and strength loss without countermeasures.' },
      { id: 'hamstrings', name: 'Hamstrings', position: [0, 0.7, -0.29], description: 'Posterior thigh group spanning from pelvis to knee to extend the hip and flex the knee. Requires targeted resistive exercise to avoid post-flight weakness.' },
      { id: 'adductors', name: 'Adductors & Sartorius', position: [0, 0.88, 0.08], description: 'Medial thigh group and strap muscle that pull the leg inward and assist hip flexion. Help control leg alignment during treadmill running in a harness.' },
      { id: 'iliotibial', name: 'Iliotibial Tract & TFL', position: [0, 0.94, -0.1], description: 'Lateral hip stabilizer and thick fibrous band running down the outer thigh to the knee. Stabilizes the pelvis and knee joint during gait.' },
      { id: 'tibialis-fibularis', name: 'Tibialis Anterior & Fibularis', position: [0, -0.65, 0.12], description: 'Anterior and lateral shin muscles and foot tendons that lift and evert the foot. Can tighten or shorten when crew members float with plantarflexed feet.' },
      { id: 'gastrocnemius', name: 'Gastrocnemius', position: [0, -0.57, -0.33], description: 'Large two-headed superficial calf muscle crossing both knee and ankle to propel walking and jumping. Unloaded in microgravity whenever push-off against the floor ceases.' },
      { id: 'soleus', name: 'Soleus', position: [0, -0.75, -0.31], description: 'Calf muscle — "anti-gravity muscle." Among the fastest to atrophy.', spaceRelevance: 'Can lose up to 30% of volume in spaceflight without resistive exercise.' },
    ],
  },
  {
    id: 'nervous',
    name: 'Nervous System',
    color: '#facc15',
    description: 'Brain, spinal cord, and nerves — controlling all body functions and consciousness.',
    spaceEffects: [
      'Upward brain shift and ventricular expansion',
      'Vestibular system recalibration (space motion sickness)',
      'Altered sensorimotor integration',
      'Possible long-term cognitive effects under study',
    ],
    parts: [
      { id: 'brain', name: 'Brain', position: [0, 3.55, 0], description: 'Central processor. Shifts upward in the skull in microgravity.', spaceRelevance: 'MRI studies show the brain physically shifts position and ventricles enlarge during spaceflight.' },
      { id: 'vestibular', name: 'Vestibular System', position: [0.12, 3.4, 0.05], description: 'Balance organs in the inner ear. Major adaptation period in microgravity.', spaceRelevance: 'Space motion sickness affects ~60-80% of astronauts in the first 2-3 days.' },
      { id: 'optic-nerve', name: 'Optic Nerve', position: [0.06, 3.5, 0.2], description: 'Transmits visual information. Affected by increased intracranial pressure (SANS).' },
    ],
  },
  {
    id: 'immune',
    name: 'Immune System',
    color: '#22c55e',
    description: 'Defense network of cells, tissues, and organs protecting against disease.',
    spaceEffects: [
      'T-cell function decreased, immune suppression observed',
      'Latent viruses (herpes, EBV, VZV) can reactivate',
      'Some bacteria become more virulent in microgravity',
      'Wound healing significantly impaired',
    ],
    parts: [
      { id: 'thymus', name: 'Thymus', position: [0, 2.8, 0.1], description: 'T-cell maturation organ. Immune suppression in space may relate to thymic changes.' },
      { id: 'spleen', name: 'Spleen', position: [-0.2, 1.8, 0], description: 'Filters blood and houses immune cells. Function may be altered by fluid redistribution.' },
      { id: 'lymph-nodes', name: 'Lymph Nodes', position: [0.2, 3.0, 0.1], description: 'Immune surveillance stations. Lymphatic drainage is altered without gravity.' },
    ],
  },
];

export function getSystemById(id: string): AnatomySystem | undefined {
  return ANATOMY_SYSTEMS.find((s) => s.id === id);
}
