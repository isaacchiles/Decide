export type Template = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  decision: string;
  constraints: string[];
  preferences: string[];
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
