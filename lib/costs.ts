import { IngredientRow, IngredientPriceRow } from './database';
import { convertUnit } from './scaling';

export interface IngredientCost {
  ingredientId: string;
  ingredientName: string;
  cost: number | null;
  hasPriceData: boolean;
}

export interface RecipeCostSummary {
  totalCost: number;
  costPerServing: number;
  ingredientCosts: IngredientCost[];
  missingPrices: string[];
  coverage: number;
}

const STRIP_PREFIXES = [
  'unsalted',
  'salted',
  'organic',
  'fresh',
  'frozen',
  'dried',
  'raw',
  'cooked',
  'roasted',
  'toasted',
  'smoked',
  'ground',
  'whole',
  'chopped',
  'diced',
  'minced',
  'sliced',
  'shredded',
  'crushed',
  'grated',
  'melted',
  'softened',
  'cold',
  'warm',
  'hot',
  'blanched',
  'peeled',
  'deveined',
  'boneless',
  'skinless',
  'low-fat',
  'nonfat',
  'fat-free',
  'reduced-fat',
  'light',
  'extra-virgin',
  'virgin',
  'unbleached',
  'all-purpose',
  'self-rising',
  'large',
  'medium',
  'small',
  'fine',
  'coarse',
  'dark',
  'white',
  'black',
  'red',
  'green',
  'yellow',
];

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function stripPrefixes(name: string): string {
  let result = name;
  for (const prefix of STRIP_PREFIXES) {
    const re = new RegExp(`\\b${prefix}\\b`, 'g');
    result = result.replace(re, '');
  }
  return result.replace(/,/g, '').replace(/\s+/g, ' ').trim();
}

function extractCoreWords(name: string): string[] {
  return stripPrefixes(name).split(/\s+/).filter(Boolean);
}

export function findPriceMatch(
  ingredientName: string,
  prices: IngredientPriceRow[]
): IngredientPriceRow | undefined {
  const normalized = normalizeIngredientName(ingredientName);

  const exact = prices.find(
    (p) => normalizeIngredientName(p.ingredientName) === normalized
  );
  if (exact) return exact;

  const stripped = stripPrefixes(normalized);
  const strippedMatch = prices.find(
    (p) => stripPrefixes(normalizeIngredientName(p.ingredientName)) === stripped
  );
  if (strippedMatch) return strippedMatch;

  const flipped = normalized.split(',').map((s) => s.trim()).filter(Boolean).reverse().join(' ');
  if (flipped !== normalized) {
    const flippedStripped = stripPrefixes(flipped);
    const flippedMatch = prices.find(
      (p) => stripPrefixes(normalizeIngredientName(p.ingredientName)) === flippedStripped
    );
    if (flippedMatch) return flippedMatch;
  }

  const coreWords = extractCoreWords(normalized);
  if (coreWords.length > 0) {
    const coreMatch = prices.find((p) => {
      const pCore = extractCoreWords(normalizeIngredientName(p.ingredientName));
      return pCore.length > 0 && coreWords.some((w) => pCore.includes(w));
    });
    if (coreMatch) return coreMatch;
  }

  return undefined;
}

export function calculateIngredientCost(
  ingredient: IngredientRow,
  scaledAmount: number,
  prices: IngredientPriceRow[]
): IngredientCost {
  const priceEntry = findPriceMatch(ingredient.name, prices);

  if (!priceEntry || priceEntry.costPerUnit == null) {
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      cost: null,
      hasPriceData: false,
    };
  }

  let convertedAmount = scaledAmount;
  if (priceEntry.costUnit && ingredient.unit !== priceEntry.costUnit) {
    const converted = convertUnit(scaledAmount, ingredient.unit, priceEntry.costUnit);
    if (converted !== null) {
      convertedAmount = converted;
    }
  }

  const cost = Math.round(priceEntry.costPerUnit * convertedAmount * 100) / 100;

  return {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    cost,
    hasPriceData: true,
  };
}

export function calculateRecipeCost(
  ingredients: IngredientRow[],
  scaledAmounts: number[],
  prices: IngredientPriceRow[],
  servings: number
): RecipeCostSummary {
  const ingredientCosts = ingredients.map((ing, i) =>
    calculateIngredientCost(ing, scaledAmounts[i] ?? ing.amount, prices)
  );

  const missingPrices = ingredientCosts
    .filter((c) => !c.hasPriceData)
    .map((c) => c.ingredientName);

  const totalCost = ingredientCosts
    .filter((c) => c.cost !== null)
    .reduce((sum, c) => sum + (c.cost ?? 0), 0);

  const coverage = ingredients.length > 0
    ? ((ingredients.length - missingPrices.length) / ingredients.length) * 100
    : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPerServing: servings > 0 ? Math.round((totalCost / servings) * 100) / 100 : 0,
    ingredientCosts,
    missingPrices,
    coverage: Math.round(coverage),
  };
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
