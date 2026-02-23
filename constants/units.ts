export type UnitCategory = 'volume' | 'weight' | 'count' | 'length' | 'temperature';

export interface UnitDefinition {
  name: string;
  abbreviation: string;
  category: UnitCategory;
  toBase: number;
  baseName: string;
}

export const UNITS: Record<string, UnitDefinition> = {
  tsp: { name: 'teaspoon', abbreviation: 'tsp', category: 'volume', toBase: 4.929, baseName: 'ml' },
  tbsp: { name: 'tablespoon', abbreviation: 'tbsp', category: 'volume', toBase: 14.787, baseName: 'ml' },
  fl_oz: { name: 'fluid ounce', abbreviation: 'fl oz', category: 'volume', toBase: 29.574, baseName: 'ml' },
  cup: { name: 'cup', abbreviation: 'cup', category: 'volume', toBase: 236.588, baseName: 'ml' },
  pint: { name: 'pint', abbreviation: 'pt', category: 'volume', toBase: 473.176, baseName: 'ml' },
  quart: { name: 'quart', abbreviation: 'qt', category: 'volume', toBase: 946.353, baseName: 'ml' },
  gallon: { name: 'gallon', abbreviation: 'gal', category: 'volume', toBase: 3785.41, baseName: 'ml' },
  ml: { name: 'milliliter', abbreviation: 'ml', category: 'volume', toBase: 1, baseName: 'ml' },
  l: { name: 'liter', abbreviation: 'L', category: 'volume', toBase: 1000, baseName: 'ml' },

  oz: { name: 'ounce', abbreviation: 'oz', category: 'weight', toBase: 28.3495, baseName: 'g' },
  lb: { name: 'pound', abbreviation: 'lb', category: 'weight', toBase: 453.592, baseName: 'g' },
  g: { name: 'gram', abbreviation: 'g', category: 'weight', toBase: 1, baseName: 'g' },
  kg: { name: 'kilogram', abbreviation: 'kg', category: 'weight', toBase: 1000, baseName: 'g' },

  piece: { name: 'piece', abbreviation: 'pc', category: 'count', toBase: 1, baseName: 'piece' },
  dozen: { name: 'dozen', abbreviation: 'doz', category: 'count', toBase: 12, baseName: 'piece' },
  pinch: { name: 'pinch', abbreviation: 'pinch', category: 'count', toBase: 1, baseName: 'pinch' },
  dash: { name: 'dash', abbreviation: 'dash', category: 'count', toBase: 1, baseName: 'dash' },
  clove: { name: 'clove', abbreviation: 'clove', category: 'count', toBase: 1, baseName: 'clove' },
  slice: { name: 'slice', abbreviation: 'slice', category: 'count', toBase: 1, baseName: 'slice' },
  bunch: { name: 'bunch', abbreviation: 'bunch', category: 'count', toBase: 1, baseName: 'bunch' },
  can: { name: 'can', abbreviation: 'can', category: 'count', toBase: 1, baseName: 'can' },
  package: { name: 'package', abbreviation: 'pkg', category: 'count', toBase: 1, baseName: 'package' },
  stick: { name: 'stick', abbreviation: 'stick', category: 'count', toBase: 1, baseName: 'stick' },
  each: { name: 'each', abbreviation: 'ea', category: 'count', toBase: 1, baseName: 'each' },
  bottle: { name: 'bottle', abbreviation: 'btl', category: 'count', toBase: 1, baseName: 'bottle' },
  sprig: { name: 'sprig', abbreviation: 'sprig', category: 'count', toBase: 1, baseName: 'sprig' },
  head: { name: 'head', abbreviation: 'head', category: 'count', toBase: 1, baseName: 'head' },
  stalk: { name: 'stalk', abbreviation: 'stalk', category: 'count', toBase: 1, baseName: 'stalk' },
};

export const UNIT_CATEGORIES: Record<UnitCategory, string[]> = {
  volume: ['tsp', 'tbsp', 'fl_oz', 'cup', 'pint', 'quart', 'gallon', 'ml', 'l'],
  weight: ['oz', 'lb', 'g', 'kg'],
  count: ['piece', 'each', 'dozen', 'pinch', 'dash', 'clove', 'slice', 'bunch', 'can', 'bottle', 'package', 'stick', 'sprig', 'head', 'stalk'],
  length: [],
  temperature: [],
};

export const COMMON_UNITS = ['tsp', 'tbsp', 'cup', 'fl_oz', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'each', 'pinch', 'bunch', 'can', 'bottle', 'clove', 'sprig', 'head', 'stalk'];
