// Smart unit suggestions keyed off common restaurant pantry ingredients.
// Used by the purchase cost editor to pre-select a sensible base unit and
// offer relevant alternates as quick-chips above the full unit picker.
//
// Match order: exact → single-word substring → fallback. Case-insensitive,
// and intentionally forgiving — "all-purpose flour" matches "flour".

export interface UnitHint {
  /** The most likely unit for this ingredient — used as the default. */
  primary: string;
  /** 2–4 runner-up units to offer as quick-chips. */
  alternates: string[];
}

// Dictionary covers ~80% of a real restaurant pantry. Keys are lowercase
// single words unless a multi-word phrase is a compound noun that wouldn't
// match via single-word lookup (e.g. "olive oil" vs bare "oil").
const HINTS: Record<string, UnitHint> = {
  // Baking + dry goods
  flour: { primary: 'lb', alternates: ['kg', 'cup', 'oz'] },
  sugar: { primary: 'lb', alternates: ['cup', 'oz', 'kg'] },
  salt: { primary: 'lb', alternates: ['oz', 'tbsp', 'tsp'] },
  rice: { primary: 'lb', alternates: ['cup', 'kg', 'oz'] },
  pasta: { primary: 'lb', alternates: ['oz', 'kg'] },
  oats: { primary: 'lb', alternates: ['cup', 'oz'] },
  beans: { primary: 'lb', alternates: ['can', 'cup', 'oz'] },
  lentils: { primary: 'lb', alternates: ['cup', 'oz'] },
  cornmeal: { primary: 'lb', alternates: ['cup', 'oz'] },
  breadcrumbs: { primary: 'lb', alternates: ['cup', 'oz'] },
  yeast: { primary: 'oz', alternates: ['tsp', 'package'] },

  // Fats + oils
  butter: { primary: 'lb', alternates: ['stick', 'oz', 'cup', 'tbsp'] },
  oil: { primary: 'fl_oz', alternates: ['cup', 'l', 'gallon'] },
  'olive oil': { primary: 'fl_oz', alternates: ['cup', 'l', 'gallon'] },
  shortening: { primary: 'lb', alternates: ['cup', 'oz'] },
  lard: { primary: 'lb', alternates: ['cup', 'oz'] },

  // Dairy + eggs
  milk: { primary: 'gallon', alternates: ['quart', 'cup', 'l'] },
  cream: { primary: 'quart', alternates: ['cup', 'fl_oz', 'pint'] },
  'heavy cream': { primary: 'quart', alternates: ['cup', 'fl_oz'] },
  'half and half': { primary: 'quart', alternates: ['cup', 'fl_oz'] },
  buttermilk: { primary: 'quart', alternates: ['cup', 'fl_oz'] },
  cheese: { primary: 'lb', alternates: ['oz', 'cup'] },
  parmesan: { primary: 'lb', alternates: ['oz', 'cup'] },
  mozzarella: { primary: 'lb', alternates: ['oz', 'cup'] },
  yogurt: { primary: 'oz', alternates: ['cup', 'lb'] },
  'sour cream': { primary: 'oz', alternates: ['cup', 'lb'] },
  egg: { primary: 'dozen', alternates: ['each', 'lb'] },
  eggs: { primary: 'dozen', alternates: ['each', 'lb'] },

  // Proteins
  chicken: { primary: 'lb', alternates: ['oz', 'kg'] },
  beef: { primary: 'lb', alternates: ['oz', 'kg'] },
  pork: { primary: 'lb', alternates: ['oz', 'kg'] },
  lamb: { primary: 'lb', alternates: ['oz', 'kg'] },
  fish: { primary: 'lb', alternates: ['oz', 'each'] },
  salmon: { primary: 'lb', alternates: ['oz', 'each'] },
  tuna: { primary: 'lb', alternates: ['oz', 'can'] },
  shrimp: { primary: 'lb', alternates: ['oz', 'each'] },
  bacon: { primary: 'lb', alternates: ['slice', 'oz'] },
  sausage: { primary: 'lb', alternates: ['each', 'oz'] },
  ham: { primary: 'lb', alternates: ['oz', 'slice'] },

  // Produce
  onion: { primary: 'lb', alternates: ['each', 'oz'] },
  onions: { primary: 'lb', alternates: ['each', 'oz'] },
  garlic: { primary: 'lb', alternates: ['clove', 'head', 'oz'] },
  tomato: { primary: 'lb', alternates: ['each', 'can', 'oz'] },
  tomatoes: { primary: 'lb', alternates: ['each', 'can', 'oz'] },
  potato: { primary: 'lb', alternates: ['each', 'oz'] },
  potatoes: { primary: 'lb', alternates: ['each', 'oz'] },
  carrot: { primary: 'lb', alternates: ['each', 'oz'] },
  carrots: { primary: 'lb', alternates: ['each', 'oz'] },
  celery: { primary: 'lb', alternates: ['stalk', 'bunch', 'oz'] },
  lettuce: { primary: 'head', alternates: ['lb', 'oz'] },
  spinach: { primary: 'lb', alternates: ['bunch', 'oz', 'cup'] },
  mushroom: { primary: 'lb', alternates: ['oz', 'each'] },
  mushrooms: { primary: 'lb', alternates: ['oz', 'each'] },
  // "pepper" alone → fresh pepper (produce). The ground spice lives under
  // "black pepper" / "white pepper" which hit the 2-word window below.
  pepper: { primary: 'lb', alternates: ['each', 'oz'] },
  'black pepper': { primary: 'oz', alternates: ['tbsp', 'tsp'] },
  'white pepper': { primary: 'oz', alternates: ['tbsp', 'tsp'] },
  cucumber: { primary: 'each', alternates: ['lb', 'oz'] },
  avocado: { primary: 'each', alternates: ['lb', 'oz'] },
  lemon: { primary: 'each', alternates: ['lb', 'oz'] },
  lime: { primary: 'each', alternates: ['lb', 'oz'] },
  orange: { primary: 'each', alternates: ['lb', 'oz'] },

  // Herbs (fresh)
  basil: { primary: 'bunch', alternates: ['oz', 'cup'] },
  parsley: { primary: 'bunch', alternates: ['oz', 'cup'] },
  cilantro: { primary: 'bunch', alternates: ['oz', 'cup'] },
  mint: { primary: 'bunch', alternates: ['oz', 'sprig'] },
  rosemary: { primary: 'sprig', alternates: ['oz', 'bunch'] },
  thyme: { primary: 'sprig', alternates: ['oz', 'bunch'] },
  sage: { primary: 'sprig', alternates: ['oz', 'bunch'] },
  dill: { primary: 'bunch', alternates: ['oz', 'sprig'] },
  chives: { primary: 'bunch', alternates: ['oz'] },

  // Liquids
  water: { primary: 'cup', alternates: ['l', 'gallon', 'fl_oz'] },
  vinegar: { primary: 'fl_oz', alternates: ['cup', 'quart', 'l'] },
  'soy sauce': { primary: 'fl_oz', alternates: ['cup', 'tbsp'] },
  'worcestershire sauce': { primary: 'fl_oz', alternates: ['cup', 'tbsp'] },
  'hot sauce': { primary: 'fl_oz', alternates: ['bottle', 'tbsp'] },
  wine: { primary: 'bottle', alternates: ['l', 'fl_oz', 'cup'] },
  beer: { primary: 'bottle', alternates: ['can', 'l', 'fl_oz'] },
  stock: { primary: 'quart', alternates: ['cup', 'can', 'l'] },
  broth: { primary: 'quart', alternates: ['cup', 'can', 'l'] },

  // Baked + bread
  bread: { primary: 'loaf', alternates: ['slice', 'lb'] },
  tortilla: { primary: 'each', alternates: ['package', 'dozen'] },
  tortillas: { primary: 'each', alternates: ['package', 'dozen'] },

  // Canned/jarred
  'tomato sauce': { primary: 'can', alternates: ['oz', 'cup'] },
  'tomato paste': { primary: 'can', alternates: ['oz', 'tbsp'] },
  olives: { primary: 'lb', alternates: ['can', 'oz', 'cup'] },
  pickles: { primary: 'lb', alternates: ['jar', 'oz'] },

  // Spices + seasonings (keep separate to avoid dominating produce matches)
  paprika: { primary: 'oz', alternates: ['tbsp', 'tsp'] },
  cumin: { primary: 'oz', alternates: ['tbsp', 'tsp'] },
  cinnamon: { primary: 'oz', alternates: ['tbsp', 'tsp'] },
  nutmeg: { primary: 'oz', alternates: ['tbsp', 'tsp'] },
  oregano: { primary: 'oz', alternates: ['tbsp', 'tsp'] },
  vanilla: { primary: 'fl_oz', alternates: ['tsp', 'bottle'] },
  'baking powder': { primary: 'oz', alternates: ['tbsp', 'tsp'] },
  'baking soda': { primary: 'oz', alternates: ['tbsp', 'tsp'] },
};

const FALLBACK: UnitHint = { primary: 'each', alternates: ['lb', 'oz', 'cup'] };

/** Strip common descriptors so "unsalted butter" matches "butter". */
const STRIP_WORDS = [
  'unsalted', 'salted', 'organic', 'fresh', 'frozen', 'dried', 'ground',
  'whole', 'chopped', 'diced', 'minced', 'sliced', 'shredded', 'grated',
  'extra-virgin', 'virgin', 'large', 'medium', 'small', 'all-purpose',
  'self-rising', 'unbleached', 'low-fat', 'nonfat', 'fat-free',
];

function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[,.]/g, '')
    .replace(/\s+/g, ' ');
}

function stripDescriptors(name: string): string {
  let out = name;
  for (const w of STRIP_WORDS) {
    out = out.replace(new RegExp(`\\b${w}\\b`, 'g'), '');
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Best-effort suggestion. Never throws, always returns something usable. */
export function suggestUnitsForIngredient(name: string): UnitHint {
  if (!name || typeof name !== 'string') return FALLBACK;

  const normalized = normalize(name);
  if (HINTS[normalized]) return HINTS[normalized];

  const stripped = stripDescriptors(normalized);
  if (HINTS[stripped]) return HINTS[stripped];

  // Word-level: try each word and each 2-word window
  const words = stripped.split(' ').filter(Boolean);
  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`;
    if (HINTS[pair]) return HINTS[pair];
  }
  for (const w of words) {
    if (HINTS[w]) return HINTS[w];
  }

  return FALLBACK;
}
