import { ImageSourcePropType } from 'react-native';

import { ActivityCategoryName, ActivityId } from '@/constants/activities';

export interface ActivityCatalogEntry {
  id: ActivityId;
  label: string;
  href: `/activity/${ActivityId}`;
  category: ActivityCategoryName;
  order: number;
  cardImage: ImageSourcePropType;
  diagramImage: ImageSourcePropType;
  descriptionShort: string;
  overview: string;
  materials: string[];
  instructions: string[];
  discussion: string;
}

export const ACTIVITY_CATALOG: Record<ActivityId, ActivityCatalogEntry> = {
  'parachute-drop': {
    id: 'parachute-drop',
    label: 'Parachute Drop Challenge',
    href: '/activity/parachute-drop',
    category: 'Engineering',
    order: 1,
    cardImage: require('../assets/activityCard/parachute.jpg'),
    diagramImage: require('../assets/instructions/activity1.png'),
    descriptionShort:
      'Design, build, and test a parachute to slow a toy\'s landing. Iterate prototypes under time constraints for the safest descent.',
    overview:
      'Students design, build, and test a parachute for a small toy to reduce its landing speed and impact force. Teams iterate their designs under time and material constraints, aiming to achieve the slowest and safest landing within a target area.',
    materials: [
      'Mobile phone with STEMM Lab app',
      'Small toy (e.g. army toy soldier)',
      'Table or elevated surface',
      'Paper or plastic',
      'String',
      'Scissors',
      'Tape',
    ],
    instructions: [
      'Drop the toy without a parachute and record the fall (baseline test).',
      'Build a parachute using provided materials.',
      'Drop the toy from the same height and record the fall.',
      'Review speed and landing accuracy results in the app.',
      'Redesign and test up to three prototypes within 20 minutes.',
      'Upload videos, results, and team reflections.',
    ],
    discussion:
      'Gravity pulls objects downward, causing them to speed up as they fall. A parachute increases air resistance (drag), which opposes motion and slows the fall. A slower fall reduces landing force and improves safety. Engineers improve parachute designs through repeated testing and redesign.',
  },
  'sound-pollution': {
    id: 'sound-pollution',
    label: 'Sound Pollution Hunter',
    href: '/activity/sound-pollution',
    category: 'Engineering',
    order: 2,
    cardImage: require('../assets/activityCard/sound.jpg'),
    diagramImage: require('../assets/instructions/activity2.png'),
    descriptionShort:
      'Measure and compare sound levels across classroom activities. Map loud and quiet zones using your phone.',
    overview: 'Students measure and compare sound levels in different classroom activities.',
    materials: ['Mobile phone with STEMM Lab app'],
    instructions: [
      'Measure noise from different actions (dropping objects, talking, walking, stamping feet).',
      'Record sound levels and locations.',
      'Map loud and quiet zones.',
    ],
    discussion:
      'Sound intensity varies depending on energy and surrounding surfaces. Prolonged exposure to loud noise can affect health and concentration.',
  },
  'hand-fan': {
    id: 'hand-fan',
    label: 'Hand Fan Challenge',
    href: '/activity/hand-fan',
    category: 'Engineering',
    order: 3,
    cardImage: require('../assets/activityCard/fan.jpg'),
    diagramImage: require('../assets/instructions/activity3.png'),
    descriptionShort:
      'Explore how moving air affects flexible materials. Test paper and cardboard at different fan distances.',
    overview: 'Students test how air movement affects flexible materials.',
    materials: ['Paper and cardboard', 'Scissors', 'Mobile phone', 'Sticky tape', 'STEMM Lab app'],
    instructions: [
      'Stand paper upright on a table.',
      'Fan air from 30 cm away.',
      'Observe and record movement.',
      'Repeat with different fan designs and distances (15 cm, 30 cm, 45 cm).',
      'Repeat using cardboard instead of paper.',
    ],
    discussion:
      'Moving air applies force to objects. Paper bends due to flexibility, and repeated bending can weaken materials over time.',
  },
  'earthquake-structure': {
    id: 'earthquake-structure',
    label: 'Earthquake-Resistant Structure',
    href: '/activity/earthquake-structure',
    category: 'Engineering',
    order: 4,
    cardImage: require('../assets/activityCard/earthquake.jpg'),
    diagramImage: require('../assets/instructions/activity4.png'),
    descriptionShort:
      'Build structures that withstand vibration like earthquake forces. Test and refine designs with phone sensors.',
    overview: 'Students design structures that withstand vibration, simulating earthquakes.',
    materials: [
      'Cardboard',
      'Paper',
      'Scissors',
      'Sticky tape',
      'Plastic or paper cups',
      'Mobile phone with vibration sensor',
    ],
    instructions: [
      'Build an anti-vibration layer by folding paper or cardboard.',
      'Place a flat cardboard platform on top.',
      'Place the phone in the center and activate vibration mode in the STEMM App.',
      'Modify the structure to reduce movement (e.g. more pillars, more folds).',
    ],
    discussion:
      'Earthquakes create ground vibrations that can damage structures. Engineers design buildings to absorb and distribute energy safely.',
  },
  'human-performance': {
    id: 'human-performance',
    label: 'Human Performance Lab',
    href: '/activity/human-performance',
    category: 'Health & Medical',
    order: 5,
    cardImage: require('../assets/activityCard/stretch.jpg'),
    diagramImage: require('../assets/instructions/activity5.png'),
    descriptionShort:
      'Measure speed, smoothness, and coordination during controlled stretching using phone sensors.',
    overview:
      'Students investigate how the human body moves by measuring speed, smoothness, and coordination during controlled stretching activities.',
    materials: ['Mobile phone with STEMM Lab app', 'Open space for safe movement'],
    instructions: [
      'Hold the phone firmly in one hand during each phase.',
      'Phase 1: Perform a circle, then a figure 8 in succession. Press Finish when done.',
      'Phase 2: Perform smooth up and down movements. Press Finish when done.',
      'Phase 3: Perform smooth left and right movements. Press Finish when done.',
      'Before each phase, predict the phone vibration sensor reading (absolute).',
      'The phone gives a short haptic pulse when movement is jerky; keep vibration events low.',
      'Compare predictions with outcomes and discuss which movement was hardest to keep smooth.',
      'Upload results and team reflections.',
    ],
    discussion:
      'Muscles and joints work together to create movement. Faster movements may reduce control, while smoother movements demonstrate better coordination. Phone sensors help measure biomechanics and fatigue.',
  },
  'reaction-board': {
    id: 'reaction-board',
    label: 'Reaction Board Challenge',
    href: '/activity/reaction-board',
    category: 'Health & Medical',
    order: 6,
    cardImage: require('../assets/activityCard/reaction.jpg'),
    diagramImage: require('../assets/instructions/activity6.png'),
    descriptionShort:
      'Test reaction time and coordination through tap, hand-swap, and tracing challenges.',
    overview:
      'Students measure reaction time, coordination, and improvement through repeated digital and physical challenges.',
    materials: ['Mobile phone with STEMM Lab app', 'Clear working space'],
    instructions: [
      'Phase 1 – Tap Reaction: Tap the screen as soon as the hidden button appears.',
      'Record reaction time and rotate through each team member.',
      'Phase 2 – Swap Hands: Repeat using the non-dominant hand.',
      'Compare results and rotate through each team member.',
      'Phase 3 – Tracing Challenge: Trace a moving shape on the screen.',
      'Review accuracy and delay, then rotate through each team member.',
    ],
    discussion:
      'Reaction time measures how quickly the brain processes information and sends signals to muscles. Practice can improve speed and coordination. Comparing hands shows how dominance affects performance.',
  },
  'breathing-trainer': {
    id: 'breathing-trainer',
    label: 'Breathing Pace Trainer',
    href: '/activity/breathing-trainer',
    category: 'Health & Medical',
    order: 7,
    cardImage: require('../assets/activityCard/breathing.jpg'),
    diagramImage: require('../assets/instructions/activity7.png'),
    descriptionShort:
      'Analyze breathing patterns at rest and after exercise using chest movement sensors.',
    overview: 'Students analyze breathing patterns at rest and after exercise.',
    materials: ['Mobile phone with STEMM Lab app', 'Flat surface or mat'],
    instructions: [
      'Place the phone gently on the chest.',
      'Record breathing at rest.',
      'Perform jogging on the spot for one minute.',
      'Record breathing again and compare against resting results.',
      'Perform approximately 100 star jumps (jumping jacks).',
      'Record breathing again and compare against previous phases.',
      'Rotate through each team member until everyone completes all three phases.',
    ],
    discussion:
      'Breathing rate increases during exercise to supply more oxygen to muscles. Sensors detect chest movement, helping students visualise breathing patterns.',
  },
};

export const ACTIVITY_LIST = Object.values(ACTIVITY_CATALOG).sort((a, b) => a.order - b.order);

export const SOUND_LEVEL_REFERENCE = [
  { range: '0–30 dB', examples: 'Whisper, quiet library', risk: 'No risk' },
  { range: '30–60 dB', examples: 'Normal conversation, classroom noise', risk: 'Safe for long periods' },
  { range: '60–85 dB', examples: 'Busy traffic, vacuum cleaner', risk: 'Generally safe, but long exposure can cause fatigue' },
  { range: '85–90 dB', examples: 'Lawn mower, loud classroom, heavy traffic', risk: 'Hearing damage possible after long exposure' },
  { range: '90–100 dB', examples: 'Motorbike, power tools, loud music', risk: 'Hearing damage likely after short exposure' },
  { range: '100–110 dB', examples: 'Nightclub, rock concert, chainsaw', risk: 'Serious hearing damage in minutes' },
  { range: '110–120 dB', examples: 'Siren close by, car horn at 1 m', risk: 'Painful; immediate damage possible' },
  { range: '120–130 dB', examples: 'Jet engine at close range', risk: 'Immediate and severe hearing damage' },
  { range: '140+ dB', examples: 'Explosion, gunshot', risk: 'Instant, permanent hearing damage' },
] as const;
