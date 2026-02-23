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

export function calculateIngredientCost(
  ingredient: IngredientRow,
  scaledAmount: number,
  prices: IngredientPriceRow[]
): IngredientCost {
  const normalizedName = ingredient.name.toLowerCase().trim();
  const priceEntry = prices.find(
    (p) => p.ingredientName.toLowerCase().trim() === normalizedName
  );

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
