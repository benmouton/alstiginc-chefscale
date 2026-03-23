export type AllergenConfidence = 'major' | 'trace';

export interface AllergenKeyword {
  term: string;
  confidence: AllergenConfidence;
}

export interface AllergenInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  classifiedKeywords: AllergenKeyword[];
}

export const ALLERGENS: AllergenInfo[] = [
  {
    id: 'dairy',
    name: 'Dairy',
    icon: 'water-outline',
    color: '#60A5FA',
    keywords: [
      'milk', 'cream', 'cheese', 'butter', 'yogurt', 'whey', 'casein',
      'lactose', 'ghee', 'curd', 'custard', 'ice cream', 'sour cream',
      'cottage cheese', 'ricotta', 'mozzarella', 'parmesan', 'cheddar',
      'brie', 'camembert', 'gouda', 'swiss', 'provolone', 'mascarpone',
      'cream cheese', 'half and half', 'evaporated milk', 'condensed milk',
      'buttermilk', 'kefir', 'paneer', 'queso',
    ],
    classifiedKeywords: [
      { term: 'milk', confidence: 'major' }, { term: 'cream', confidence: 'major' },
      { term: 'cheese', confidence: 'major' }, { term: 'butter', confidence: 'major' },
      { term: 'yogurt', confidence: 'major' }, { term: 'ice cream', confidence: 'major' },
      { term: 'sour cream', confidence: 'major' }, { term: 'cream cheese', confidence: 'major' },
      { term: 'paneer', confidence: 'major' }, { term: 'kefir', confidence: 'major' },
      { term: 'whey', confidence: 'trace' }, { term: 'casein', confidence: 'trace' },
      { term: 'lactose', confidence: 'trace' }, { term: 'ghee', confidence: 'trace' },
    ],
  },
  {
    id: 'gluten',
    name: 'Gluten',
    icon: 'nutrition-outline',
    color: '#FBBF24',
    keywords: [
      'wheat', 'flour', 'bread', 'pasta', 'noodle', 'barley', 'rye',
      'oat', 'semolina', 'couscous', 'bulgur', 'farro', 'spelt',
      'cracker', 'cereal', 'tortilla', 'pita', 'sourdough', 'brioche',
      'croissant', 'baguette', 'breadcrumb', 'panko', 'soy sauce',
      'teriyaki', 'seitan',
    ],
    classifiedKeywords: [
      { term: 'flour', confidence: 'major' }, { term: 'bread', confidence: 'major' },
      { term: 'pasta', confidence: 'major' }, { term: 'noodle', confidence: 'major' },
      { term: 'wheat', confidence: 'major' }, { term: 'seitan', confidence: 'major' },
      { term: 'couscous', confidence: 'major' }, { term: 'tortilla', confidence: 'major' },
      { term: 'soy sauce', confidence: 'trace' }, { term: 'teriyaki', confidence: 'trace' },
      { term: 'breadcrumb', confidence: 'trace' }, { term: 'panko', confidence: 'trace' },
    ],
  },
  {
    id: 'nuts',
    name: 'Tree Nuts',
    icon: 'leaf-outline',
    color: '#A78BFA',
    keywords: [
      'almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'macadamia',
      'hazelnut', 'brazil nut', 'pine nut', 'chestnut', 'praline',
      'marzipan', 'nougat', 'nut butter', 'nut milk', 'almond milk',
      'almond flour', 'coconut',
    ],
    classifiedKeywords: [
      { term: 'almond', confidence: 'major' }, { term: 'walnut', confidence: 'major' },
      { term: 'pecan', confidence: 'major' }, { term: 'cashew', confidence: 'major' },
      { term: 'pistachio', confidence: 'major' }, { term: 'coconut', confidence: 'major' },
      { term: 'almond flour', confidence: 'major' }, { term: 'nut butter', confidence: 'major' },
      { term: 'pine nut', confidence: 'trace' }, { term: 'nut milk', confidence: 'trace' },
      { term: 'almond milk', confidence: 'trace' }, { term: 'marzipan', confidence: 'trace' },
    ],
  },
  {
    id: 'peanuts',
    name: 'Peanuts',
    icon: 'ellipse-outline',
    color: '#F97316',
    keywords: [
      'peanut', 'peanut butter', 'peanut oil', 'groundnut', 'goober',
      'arachis', 'monkey nut',
    ],
    classifiedKeywords: [
      { term: 'peanut', confidence: 'major' }, { term: 'peanut butter', confidence: 'major' },
      { term: 'peanut oil', confidence: 'trace' },
    ],
  },
  {
    id: 'eggs',
    name: 'Eggs',
    icon: 'egg-outline',
    color: '#FCD34D',
    keywords: [
      'egg', 'eggs', 'egg white', 'egg yolk', 'meringue', 'mayonnaise',
      'aioli', 'hollandaise', 'custard', 'quiche', 'frittata', 'omelet',
      'albumin', 'lysozyme', 'lecithin',
    ],
    classifiedKeywords: [
      { term: 'egg', confidence: 'major' }, { term: 'eggs', confidence: 'major' },
      { term: 'omelet', confidence: 'major' }, { term: 'frittata', confidence: 'major' },
      { term: 'quiche', confidence: 'major' },
      { term: 'lecithin', confidence: 'trace' }, { term: 'lysozyme', confidence: 'trace' },
      { term: 'albumin', confidence: 'trace' }, { term: 'mayonnaise', confidence: 'trace' },
    ],
  },
  {
    id: 'soy',
    name: 'Soy',
    icon: 'flask-outline',
    color: '#34D399',
    keywords: [
      'soy', 'soya', 'soybean', 'tofu', 'tempeh', 'edamame', 'miso',
      'soy sauce', 'soy milk', 'soy protein', 'soy lecithin', 'tamari',
      'natto', 'soy flour',
    ],
    classifiedKeywords: [
      { term: 'tofu', confidence: 'major' }, { term: 'tempeh', confidence: 'major' },
      { term: 'edamame', confidence: 'major' }, { term: 'soy milk', confidence: 'major' },
      { term: 'soy sauce', confidence: 'trace' }, { term: 'soy lecithin', confidence: 'trace' },
      { term: 'tamari', confidence: 'trace' }, { term: 'miso', confidence: 'trace' },
    ],
  },
  {
    id: 'fish',
    name: 'Fish',
    icon: 'fish-outline',
    color: '#38BDF8',
    keywords: [
      'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'bass',
      'trout', 'sardine', 'anchovy', 'mackerel', 'swordfish', 'catfish',
      'mahi', 'snapper', 'grouper', 'sole', 'flounder', 'haddock',
      'fish sauce', 'worcestershire',
    ],
    classifiedKeywords: [
      { term: 'salmon', confidence: 'major' }, { term: 'tuna', confidence: 'major' },
      { term: 'cod', confidence: 'major' }, { term: 'halibut', confidence: 'major' },
      { term: 'trout', confidence: 'major' }, { term: 'snapper', confidence: 'major' },
      { term: 'fish sauce', confidence: 'trace' }, { term: 'worcestershire', confidence: 'trace' },
      { term: 'anchovy', confidence: 'trace' },
    ],
  },
  {
    id: 'shellfish',
    name: 'Shellfish',
    icon: 'bug-outline',
    color: '#FB7185',
    keywords: [
      'shrimp', 'crab', 'lobster', 'prawn', 'crawfish', 'crayfish',
      'clam', 'mussel', 'oyster', 'scallop', 'squid', 'calamari',
      'octopus', 'snail', 'escargot', 'abalone',
    ],
    classifiedKeywords: [
      { term: 'shrimp', confidence: 'major' }, { term: 'crab', confidence: 'major' },
      { term: 'lobster', confidence: 'major' }, { term: 'scallop', confidence: 'major' },
      { term: 'clam', confidence: 'major' }, { term: 'mussel', confidence: 'major' },
      { term: 'oyster', confidence: 'major' }, { term: 'squid', confidence: 'major' },
      { term: 'calamari', confidence: 'major' },
    ],
  },
  {
    id: 'sesame',
    name: 'Sesame',
    icon: 'radio-button-off-outline',
    color: '#D4A574',
    keywords: [
      'sesame', 'sesame seed', 'sesame oil', 'tahini', 'halvah',
      'hummus', 'sesame paste', 'gomashio',
    ],
    classifiedKeywords: [
      { term: 'sesame seed', confidence: 'major' }, { term: 'tahini', confidence: 'major' },
      { term: 'sesame oil', confidence: 'trace' }, { term: 'hummus', confidence: 'trace' },
    ],
  },
];

export const DIETARY_FLAGS = [
  { id: 'vegetarian', name: 'Vegetarian', icon: 'leaf-outline', color: '#22C55E' },
  { id: 'vegan', name: 'Vegan', icon: 'flower-outline', color: '#10B981' },
  { id: 'halal', name: 'Halal', icon: 'checkmark-circle-outline', color: '#6366F1' },
  { id: 'kosher', name: 'Kosher', icon: 'star-outline', color: '#8B5CF6' },
];
