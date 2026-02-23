export interface AllergenInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
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
  },
];

export const DIETARY_FLAGS = [
  { id: 'vegetarian', name: 'Vegetarian', icon: 'leaf-outline', color: '#22C55E' },
  { id: 'vegan', name: 'Vegan', icon: 'flower-outline', color: '#10B981' },
  { id: 'halal', name: 'Halal', icon: 'checkmark-circle-outline', color: '#6366F1' },
  { id: 'kosher', name: 'Kosher', icon: 'star-outline', color: '#8B5CF6' },
];
