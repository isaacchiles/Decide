export type Template = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  decision: string;
  constraints: string[];
  preferences: string[];
  // Kept in the list (not deleted) but excluded from the template picker UI.
  // Used to pull a template from rotation without losing the content.
  hidden?: boolean;
};

export const TEMPLATES: Template[] = [
  {
    id: 'car',
    emoji: '🚗',
    name: 'Car Purchase',
    description: 'Find the right vehicle for your needs and budget',
    decision: 'I need to buy a new car',
    constraints: [
      'Under $40,000',
      'Must fit 3 car seats',
      'Good safety ratings',
    ],
    preferences: [
      'Prefer SUV or crossover',
      'Good fuel economy or electric',
      'Reliability over luxury features',
    ],
  },
  {
    id: 'baby',
    emoji: '👶',
    name: 'Baby Items',
    description: 'Find the safest car seat for your child and vehicle',
    decision: 'I need to buy a car seat for my baby',
    constraints: [
      'Top crash-test safety ratings',
      'Fits our vehicle model',
      'Not expired or close to its expiration date',
    ],
    preferences: [
      'Easy for one person to install correctly',
      'Convertible — grows with my child',
      'Cover is machine-washable',
    ],
  },
  {
    id: 'smart-home',
    emoji: '💡',
    name: 'Smart Home',
    description: 'Find the right smart light bulbs for your setup',
    decision: 'I need to buy smart light bulbs for my home',
    constraints: [
      'Works with Alexa, Google Home, or HomeKit',
      'Under $50 for a 4-pack',
      'No separate hub required',
    ],
    preferences: [
      'Wide color range, not just white/warm',
      'Reliable app with minimal lag',
      'Energy efficient with a long lifespan',
    ],
  },
  {
    id: 'home',
    emoji: '🏠',
    name: 'Home Purchase',
    description: 'Compare properties against what matters most to you',
    decision: 'I need to buy a home',
    constraints: [
      'Under $600,000',
      'At least 3 bedrooms',
      'Good school district',
    ],
    preferences: [
      'Prefer move-in ready over fixer-upper',
      'Short commute to work',
      'Quiet neighborhood',
    ],
    hidden: true,
  },
  {
    id: 'job',
    emoji: '💼',
    name: 'Job Offer',
    description: 'Weigh competing offers or evaluate a career move',
    decision: 'I need to choose between job offers',
    constraints: [
      'Salary above $100,000',
      'Health insurance included',
      'Remote or hybrid option',
    ],
    preferences: [
      'Growth potential over immediate pay',
      'Strong engineering culture',
      'Mission I care about',
    ],
    // Hidden 2026-07-02: this use case isn't built out (no enhanced
    // option-input for user-provided offer details — see BACKLOG BKL-004)
    // and doesn't map to an Amazon affiliate outcome. Swapped for Robot
    // Vacuum, a much higher-research, high-affiliate-fit category. Kept
    // rather than deleted — job/career decisions are still a content pillar.
    hidden: true,
  },
  {
    id: 'robot-vacuum',
    emoji: '🧹',
    name: 'Robot Vacuum',
    description: 'Cut through the feature list and find the right one for your home',
    decision: 'I need to buy a robot vacuum',
    constraints: [
      'Under $500',
      'Works well on both carpet and hardwood',
      'Strong pet hair pickup',
    ],
    preferences: [
      'Self-emptying base',
      'Smart mapping / no-go zones',
      'Quiet enough to run while I work from home',
    ],
  },
  {
    id: 'city',
    emoji: '🏙️',
    name: 'City to Move To',
    description: 'Decide where to put down roots next',
    decision: 'I need to choose a city to move to',
    constraints: [
      'Reasonable cost of living',
      'Good job market in my field',
      'Safe neighborhoods',
    ],
    preferences: [
      'Warm climate preferred',
      'Walkable or good transit',
      'Vibrant food and culture scene',
    ],
  },
  {
    id: 'laptop',
    emoji: '💻',
    name: 'Laptop Purchase',
    description: 'Find the best machine for your workflow',
    decision: 'I need to buy a new laptop',
    constraints: [
      'Under $2,500',
      'At least 16GB RAM',
      'Good battery life (8+ hours)',
    ],
    preferences: [
      'Mac ecosystem preferred',
      'Lightweight for travel',
      'Great display quality',
    ],
  },
];
