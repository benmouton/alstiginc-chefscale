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

function scoreMatch(ingredientWords: string[], priceWords: string[]): number {
  if (ingredientWords.length === 0 || priceWords.length === 0) return 0;
  const overlap = ingredientWords.filter((w) => priceWords.includes(w));
  if (overlap.length === 0) return 0;
  // Score: fraction of words matched in both directions, averaged
  const ingredientCoverage = overlap.length / ingredientWords.length;
  const priceCoverage = overlap.length / priceWords.length;
  return (ingredientCoverage + priceCoverage) / 2;
}

export function findPriceMatch(
  ingredientName: string,
  prices: IngredientPriceRow[]
): IngredientPriceRow | undefined {
  const normalized = normalizeIngredientName(ingredientName);

  // Tier 1: exact match
  const exact = prices.find(
    (p) => normalizeIngredientName(p.ingredientName) === normalized
  );
  if (exact) return exact;

  // Tier 2: match after stripping prefixes (e.g. "unsalted butter" → "butter")
  const stripped = stripPrefixes(normalized);
  const strippedMatch = prices.find(
    (p) => stripPrefixes(normalizeIngredientName(p.ingredientName)) === stripped
  );
  if (strippedMatch) return strippedMatch;

  // Tier 3: comma-flipped match (e.g. "flour, all-purpose" → "all-purpose flour")
  const flipped = normalized.split(',').map((s) => s.trim()).filter(Boolean).reverse().join(' ');
  if (flipped !== normalized) {
    const flippedStripped = stripPrefixes(flipped);
    const flippedMatch = prices.find(
      (p) => stripPrefixes(normalizeIngredientName(p.ingredientName)) === flippedStripped
    );
    if (flippedMatch) return flippedMatch;
  }

  // Tier 4: weighted word overlap scoring (prevents "butter" matching "peanut butter")
  const ingredientWords = extractCoreWords(normalized);
  if (ingredientWords.length > 0) {
    let bestScore = 0;
    let bestMatch: IngredientPriceRow | undefined;
    for (const p of prices) {
      const pWords = extractCoreWords(normalizeIngredientName(p.ingredientName));
      const score = scoreMatch(ingredientWords, pWords);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = p;
      }
    }
    // Require at least 50% bidirectional overlap to prevent weak matches
    if (bestMatch && bestScore >= 0.5) return bestMatch;
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
