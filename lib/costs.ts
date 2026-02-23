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
  scaledQuantity: number,
  prices: IngredientPriceRow[]
): IngredientCost {
  const normalizedName = ingredient.name.toLowerCase().trim();
  const priceEntry = prices.find(
    (p) => p.ingredientName.toLowerCase().trim() === normalizedName
  );

  if (!priceEntry) {
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      cost: null,
      hasPriceData: false,
    };
  }

  let convertedQuantity = scaledQuantity;
  if (ingredient.unit !== priceEntry.unit) {
    const converted = convertUnit(scaledQuantity, ingredient.unit, priceEntry.unit);
    if (converted !== null) {
      convertedQuantity = converted;
    }
  }

  const unitPrice = priceEntry.price / priceEntry.quantity;
  const cost = Math.round(unitPrice * convertedQuantity * 100) / 100;

  return {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    cost,
    hasPriceData: true,
  };
}

export function calculateRecipeCost(
  ingredients: IngredientRow[],
  scaledQuantities: number[],
  prices: IngredientPriceRow[],
  servings: number
): RecipeCostSummary {
  const ingredientCosts = ingredients.map((ing, i) =>
    calculateIngredientCost(ing, scaledQuantities[i] ?? ing.quantity, prices)
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
