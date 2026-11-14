export interface MedicalModule {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  spaceRelevance: string;
  skills: MedicalSkill[];
  scenarios: MedicalScenario[];
}

export interface MedicalSkill {
  id: string;
  moduleId: string;
  question: string;
  answer: string;
  explanation: string;
  tags: string[];
}

export interface MedicalScenario {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  missionDay: number;
  steps: ScenarioStep[];
}

export interface ScenarioStep {
  narrative: string;
  question: string;
  options: { text: string; correct: boolean; feedback: string }[];
}

export const MEDICAL_MODULES: MedicalModule[] = [
  {
    id: 'wound-care',
    title: 'Wound Care in Microgravity',
    description: 'Managing lacerations, burns, and wound healing in space environments where fluid behavior and infection risk differ from Earth.',
    category: 'Emergency Medicine',
    icon: '🩹',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    spaceRelevance: 'Wounds heal ~60% slower in microgravity. Fluid containment and infection control present unique challenges without gravity.',
    skills: [
      {
        id: 'wc-1',
        moduleId: 'wound-care',
        question: 'What is the primary concern when managing an open wound in microgravity?',
        answer: 'Fluid containment — blood and wound fluids form floating globules instead of flowing downward.',
        explanation: 'Without gravity, blood forms spherical droplets that can float freely through the cabin, creating biohazard risks and making wound assessment difficult. Absorbent barriers and suction are essential.',
        tags: ['microgravity', 'fluid-dynamics', 'wound-management'],
      },
      {
        id: 'wc-2',
        moduleId: 'wound-care',
        question: 'How does wound healing differ in space compared to Earth?',
        answer: 'Wound healing is delayed by approximately 60% due to impaired inflammatory response, altered blood flow, and immune system changes.',
        explanation: 'Spaceflight affects the immune system, reducing T-cell function and altering cytokine production. Combined with fluid redistribution (cephalad shift), peripheral circulation is altered, slowing the healing cascade.',
        tags: ['healing', 'immune-system', 'physiology'],
      },
      {
        id: 'wc-3',
        moduleId: 'wound-care',
        question: 'What type of wound closure is preferred for lacerations in space?',
        answer: 'Adhesive wound closure strips (Steri-Strips) or tissue adhesive (Dermabond), due to simplicity and lower infection risk.',
        explanation: 'Suturing requires more skill and sterile equipment. Adhesive methods are faster, reduce the need for anesthesia, and have lower infection rates — critical advantages when medical resources are limited.',
        tags: ['closure', 'technique', 'resources'],
      },
      {
        id: 'wc-4',
        moduleId: 'wound-care',
        question: 'Why is infection risk elevated for wounds sustained in space?',
        answer: 'Immune suppression, altered microbial virulence, and limited antibiotic options all increase infection risk.',
        explanation: 'Research shows that some bacteria become more virulent in microgravity while crew immune function decreases. The closed environment of a spacecraft also increases exposure to opportunistic organisms.',
        tags: ['infection', 'microbiology', 'immune-system'],
      },
    ],
    scenarios: [
      {
        id: 'wc-scenario-1',
        moduleId: 'wound-care',
        title: 'Workshop Laceration',
        description: 'A crew member sustains a 4cm laceration on their forearm while performing maintenance on a science rack.',
        missionDay: 180,
        steps: [
          {
            narrative: 'Engineer Vasquez reports a sharp pain in her left forearm. You see a 4cm laceration with moderate bleeding. Small blood droplets are beginning to float in the cabin air.',
            question: 'What is your first action?',
            options: [
              { text: 'Apply direct pressure with sterile gauze and contain floating blood droplets', correct: true, feedback: 'Correct. Hemorrhage control and biohazard containment are the immediate priorities in microgravity.' },
              { text: 'Irrigate the wound immediately with saline', correct: false, feedback: 'Irrigation is important but secondary. In microgravity, uncontained saline and blood would create floating biohazard. Control bleeding first.' },
              { text: 'Prepare suture kit for wound closure', correct: false, feedback: 'Wound closure comes after hemorrhage control, assessment, and cleaning. This step is premature.' },
            ],
          },
          {
            narrative: 'Bleeding is controlled. The wound appears clean with no visible foreign material. Depth is approximately 3mm — no tendon or vessel involvement.',
            question: 'What wound closure method do you choose?',
            options: [
              { text: 'Apply adhesive wound closure strips (Steri-Strips) after wound irrigation', correct: true, feedback: 'Correct. For a clean, shallow laceration, adhesive strips provide effective closure with minimal infection risk and skill requirement.' },
              { text: 'Suture with 4-0 nylon', correct: false, feedback: 'Suturing would work but is unnecessary for this wound depth. It requires more skill, equipment, and introduces additional infection risk from needle punctures.' },
              { text: 'Leave wound open to heal by secondary intention', correct: false, feedback: 'Open healing is slower and has higher infection risk. This wound is suitable for primary closure.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cpr-microgravity',
    title: 'CPR in Microgravity',
    description: 'Performing cardiopulmonary resuscitation without gravity — modified techniques, body positioning, and the Evetts-Russomano method.',
    category: 'Emergency Medicine',
    icon: '❤️‍🩹',
    difficulty: 'advanced',
    estimatedMinutes: 20,
    spaceRelevance: 'Standard CPR is impossible without gravity providing the reaction force. The Evetts-Russomano method was developed specifically for this environment.',
    skills: [
      {
        id: 'cpr-1',
        moduleId: 'cpr-microgravity',
        question: 'Why can\'t standard CPR be performed in microgravity?',
        answer: 'Without gravity, chest compressions push the rescuer away from the patient rather than compressing the chest against a surface.',
        explanation: 'Newton\'s third law: in microgravity, the reaction force pushes the rescuer backward. There is no gravitational force keeping the patient on a surface. A restraint method must provide the reaction force that gravity normally provides.',
        tags: ['physics', 'microgravity', 'technique'],
      },
      {
        id: 'cpr-2',
        moduleId: 'cpr-microgravity',
        question: 'Describe the Evetts-Russomano method for CPR in microgravity.',
        answer: 'The rescuer wraps their legs around the patient\'s torso from behind, placing their hands on the sternum, using their leg lock as the reaction force for compressions.',
        explanation: 'Developed by Drs. Simon Evetts and Thais Russomano, this technique uses the rescuer\'s legs wrapped around the patient to provide the restraint force needed for effective chest compressions. It can be performed free-floating without any wall or restraint hardware.',
        tags: ['technique', 'evetts-russomano', 'compressions'],
      },
      {
        id: 'cpr-3',
        moduleId: 'cpr-microgravity',
        question: 'What is the recommended compression rate for CPR in microgravity?',
        answer: 'The same as Earth: 100-120 compressions per minute, with a depth of at least 5cm.',
        explanation: 'Physiological requirements for adequate perfusion do not change in microgravity. The challenge is delivering effective compressions, not changing the target parameters.',
        tags: ['parameters', 'compressions', 'guidelines'],
      },
    ],
    scenarios: [
      {
        id: 'cpr-scenario-1',
        moduleId: 'cpr-microgravity',
        title: 'Cardiac Emergency at Sol 340',
        description: 'During a routine EVA prep, a crew member becomes unresponsive.',
        missionDay: 340,
        steps: [
          {
            narrative: 'Dr. Nakamura collapses during EVA preparation. They are floating limply in the airlock module. You check — no response, no pulse, no breathing.',
            question: 'What is your immediate next step after confirming cardiac arrest?',
            options: [
              { text: 'Alert remaining crew, begin Evetts-Russomano CPR, direct someone to retrieve the AED', correct: true, feedback: 'Correct. Activate your team, start compressions immediately using the microgravity-adapted technique, and get the defibrillator.' },
              { text: 'Secure the patient to a flat surface before starting CPR', correct: false, feedback: 'Securing to a surface takes time. The Evetts-Russomano method allows immediate free-floating CPR while others prepare restraints if available.' },
              { text: 'Administer epinephrine immediately', correct: false, feedback: 'Medications are important but compressions and defibrillation take priority. High-quality CPR should begin within seconds.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bone-density',
    title: 'Bone Density Loss Management',
    description: 'Understanding and mitigating spaceflight-induced bone loss — the mechanisms, affected regions, countermeasures, and monitoring.',
    category: 'Spaceflight Physiology',
    icon: '🦴',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    spaceRelevance: 'Astronauts lose 1-2% bone mineral density per month in weight-bearing bones. On a 2.5-year Mars mission, this can reach 20-30% without countermeasures.',
    skills: [
      {
        id: 'bd-1',
        moduleId: 'bone-density',
        question: 'What is the approximate rate of bone density loss in microgravity?',
        answer: '1-2% per month in weight-bearing bones (spine, pelvis, femur), with minimal loss in non-weight-bearing bones (skull, arms).',
        explanation: 'Mechanical loading normally stimulates osteoblast activity. In microgravity, reduced loading shifts the balance toward osteoclast-mediated resorption, particularly in bones that normally bear body weight.',
        tags: ['bone-loss', 'rates', 'physiology'],
      },
      {
        id: 'bd-2',
        moduleId: 'bone-density',
        question: 'What are the primary countermeasures for bone loss in space?',
        answer: 'Resistive exercise (ARED), bisphosphonate medications, adequate vitamin D and calcium intake, and vibration therapy.',
        explanation: 'The Advanced Resistive Exercise Device (ARED) on ISS provides up to 272kg of resistance. Combined with bisphosphonates and nutrition, bone loss can be reduced to about 0.3-0.5% per month.',
        tags: ['countermeasures', 'exercise', 'medication'],
      },
      {
        id: 'bd-3',
        moduleId: 'bone-density',
        question: 'Which bones are most vulnerable to microgravity-induced density loss?',
        answer: 'Weight-bearing bones: lumbar vertebrae, pelvis (especially the femoral neck), calcaneus (heel), and proximal femur.',
        explanation: 'These bones normally experience the highest gravitational loads. Without gravity, they lose their primary stimulus for maintaining density. The femoral neck is particularly concerning as it is a common fracture site.',
        tags: ['anatomy', 'risk-areas', 'bone-loss'],
      },
    ],
    scenarios: [],
  },
  {
    id: 'radiation',
    title: 'Space Radiation Exposure',
    description: 'Understanding radiation types in space, exposure monitoring, acute radiation syndrome recognition, and protective measures.',
    category: 'Spaceflight Physiology',
    icon: '☢️',
    difficulty: 'intermediate',
    estimatedMinutes: 18,
    spaceRelevance: 'Beyond Earth\'s magnetosphere, crews face galactic cosmic rays (GCR) and solar particle events (SPE). Radiation management is essential for Mars missions.',
    skills: [
      {
        id: 'rad-1',
        moduleId: 'radiation',
        question: 'What are the two main types of space radiation of concern for deep-space missions?',
        answer: 'Galactic Cosmic Rays (GCR) — constant, high-energy heavy ions; and Solar Particle Events (SPE) — episodic bursts of protons from solar flares.',
        explanation: 'GCR is a steady background of high-energy particles from outside the solar system, difficult to shield against. SPEs are unpredictable bursts that can deliver a high dose over hours to days, but are easier to shield against.',
        tags: ['radiation-types', 'GCR', 'SPE'],
      },
      {
        id: 'rad-2',
        moduleId: 'radiation',
        question: 'What are the early symptoms of Acute Radiation Syndrome (ARS)?',
        answer: 'Nausea, vomiting, fatigue, and loss of appetite — typically within hours of high-dose exposure (>1 Gy).',
        explanation: 'The prodromal phase of ARS begins within hours. Severity and onset speed correlate with dose. A latent period may follow before the manifest illness phase. In space, an SPE shelter-in-place failure could result in acute exposure.',
        tags: ['ARS', 'symptoms', 'emergency'],
      },
    ],
    scenarios: [],
  },
  {
    id: 'pharmacology',
    title: 'Space Pharmacology',
    description: 'How drugs behave differently in space — altered absorption, metabolism, stability, and the limited onboard pharmacy.',
    category: 'Clinical Medicine',
    icon: '💊',
    difficulty: 'intermediate',
    estimatedMinutes: 12,
    spaceRelevance: 'Drug pharmacokinetics change in microgravity. Medications also degrade faster in the space radiation environment, reducing the effective pharmacy.',
    skills: [
      {
        id: 'pharm-1',
        moduleId: 'pharmacology',
        question: 'How does microgravity affect oral drug absorption?',
        answer: 'Gastric emptying is slowed and intestinal transit is altered, potentially reducing absorption rate and peak plasma concentration of oral medications.',
        explanation: 'Fluid redistribution, altered GI motility, and changes in splanchnic blood flow all affect how quickly and completely oral drugs are absorbed. This may require dosing adjustments for time-critical medications.',
        tags: ['absorption', 'pharmacokinetics', 'oral-drugs'],
      },
      {
        id: 'pharm-2',
        moduleId: 'pharmacology',
        question: 'Why do medications expire faster in space?',
        answer: 'Space radiation accelerates chemical degradation of pharmaceutical compounds, reducing shelf life compared to Earth storage.',
        explanation: 'NASA studies have found that many medications stored on ISS degrade faster than their Earth-stored counterparts. For a 2.5-year Mars mission, this means some drugs may not retain potency for the full mission duration.',
        tags: ['stability', 'radiation', 'shelf-life'],
      },
    ],
    scenarios: [],
  },
  {
    id: 'vision-icp',
    title: 'Spaceflight-Associated Neuro-Ocular Syndrome',
    description: 'Understanding SANS — the vision changes affecting many astronauts, including optic disc edema, globe flattening, and intracranial pressure changes.',
    category: 'Spaceflight Physiology',
    icon: '👁️',
    difficulty: 'advanced',
    estimatedMinutes: 15,
    spaceRelevance: 'Over 50% of ISS astronauts experience some degree of vision changes. SANS is considered one of the top risks for long-duration missions.',
    skills: [
      {
        id: 'sans-1',
        moduleId: 'vision-icp',
        question: 'What is SANS and what causes it?',
        answer: 'Spaceflight-Associated Neuro-Ocular Syndrome is a constellation of vision changes caused by cephalad fluid shift and elevated intracranial pressure in microgravity.',
        explanation: 'Without gravity, approximately 2 liters of fluid shifts from the lower body toward the head. This increases intracranial pressure, which can cause optic disc edema, globe flattening, choroidal folds, and hyperopic shifts.',
        tags: ['SANS', 'fluid-shift', 'vision'],
      },
      {
        id: 'sans-2',
        moduleId: 'vision-icp',
        question: 'What are the primary symptoms of SANS?',
        answer: 'Blurred near vision (hyperopic shift), scotomas, optic disc swelling, and cotton-wool spots on fundoscopic examination.',
        explanation: 'Most affected astronauts notice difficulty reading or performing near tasks. Changes can persist for months or even years after return to Earth. Severity varies widely between individuals.',
        tags: ['symptoms', 'diagnosis', 'vision'],
      },
    ],
    scenarios: [],
  },
];

export function getModulesByCategory(modules: MedicalModule[]): Record<string, MedicalModule[]> {
  return modules.reduce((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {} as Record<string, MedicalModule[]>);
}

export function getAllSkills(modules: MedicalModule[]): MedicalSkill[] {
  return modules.flatMap((m) => m.skills);
}
