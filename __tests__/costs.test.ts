import {
  findPriceMatch,
  calculateIngredientCost,
  calculateRecipeCost,
  formatCurrency,
} from '../lib/costs';
import type { IngredientPriceRow, IngredientRow } from '../lib/database';

const makePriceRow = (overrides: Partial<IngredientPriceRow> = {}): IngredientPriceRow => ({
  id: '1',
  ingredientName: 'butter',
  costPerUnit: 0.5,
  costUnit: 'oz',
  purchaseUnit: 'lb',
  purchaseCost: 5.99,
  updatedAt: '2026-01-01',
  ...overrides,
});

const makeIngredientRow = (overrides: Partial<IngredientRow> = {}): IngredientRow => ({
  id: '1',
  recipeId: 'r1',
  name: 'butter',
  amount: 4,
  unit: 'oz',
  category: 'dairy',
  costPerUnit: null,
  costUnit: null,
  fdcId: null,
  isOptional: 0,
  ...overrides,
});

describe('findPriceMatch', () => {
  const prices = [
    makePriceRow({ ingredientName: 'butter' }),
    makePriceRow({ id: '2', ingredientName: 'all-purpose flour' }),
    makePriceRow({ id: '3', ingredientName: 'chicken breast, boneless' }),
    makePriceRow({ id: '4', ingredientName: 'olive oil' }),
  ];

  it('finds exact match', () => {
    expect(findPriceMatch('butter', prices)?.ingredientName).toBe('butter');
  });

  it('finds case-insensitive match', () => {
    expect(findPriceMatch('Butter', prices)?.ingredientName).toBe('butter');
  });

  it('matches after stripping prefixes', () => {
    expect(findPriceMatch('unsalted butter', prices)?.ingredientName).toBe('butter');
  });

  it('matches flipped comma format', () => {
    expect(findPriceMatch('chicken breast, boneless', prices)?.ingredientName).toBe('chicken breast, boneless');
  });

  it('falls back to core word match', () => {
    expect(findPriceMatch('extra-virgin olive oil, cold-pressed', prices)?.ingredientName).toBe('olive oil');
  });

  it('returns undefined when no match', () => {
    expect(findPriceMatch('unicorn tears', prices)).toBeUndefined();
  });
});

describe('calculateIngredientCost', () => {
  it('calculates cost with matching units', () => {
    const ingredient = makeIngredientRow({ amount: 4, unit: 'oz' });
    const prices = [makePriceRow({ costPerUnit: 0.5, costUnit: 'oz' })];
    const result = calculateIngredientCost(ingredient, 4, prices);
    expect(result.cost).toBe(2);
    expect(result.hasPriceData).toBe(true);
  });

  it('returns null cost when no price data', () => {
    const ingredient = makeIngredientRow({ name: 'unicorn tears' });
    const result = calculateIngredientCost(ingredient, 4, []);
    expect(result.cost).toBeNull();
    expect(result.hasPriceData).toBe(false);
  });

  it('converts units when needed', () => {
    const ingredient = makeIngredientRow({ amount: 1, unit: 'lb' });
    const prices = [makePriceRow({ costPerUnit: 0.5, costUnit: 'oz' })];
    const result = calculateIngredientCost(ingredient, 1, prices);
    // 1 lb = ~16 oz, 16 × $0.50 = $8.00
    expect(result.cost).toBeCloseTo(8, 0);
    expect(result.hasPriceData).toBe(true);
  });

  it('uses original amount when unit conversion fails', () => {
    const ingredient = makeIngredientRow({ amount: 2, unit: 'each' });
    const prices = [makePriceRow({ costPerUnit: 1.5, costUnit: 'lb' })];
    // Can't convert 'each' to 'lb', so uses scaledAmount directly
    const result = calculateIngredientCost(ingredient, 2, prices);
    expect(result.cost).toBe(3);
    expect(result.hasPriceData).toBe(true);
  });
});

describe('calculateRecipeCost', () => {
  it('calculates total recipe cost', () => {
    const ingredients = [
      makeIngredientRow({ id: '1', name: 'butter', amount: 4, unit: 'oz' }),
      makeIngredientRow({ id: '2', name: 'flour', amount: 2, unit: 'cup' }),
    ];
    const prices = [
      makePriceRow({ ingredientName: 'butter', costPerUnit: 0.5, costUnit: 'oz' }),
      makePriceRow({ id: '2', ingredientName: 'flour', costPerUnit: 0.25, costUnit: 'cup' }),
    ];
    const result = calculateRecipeCost(ingredients, [4, 2], prices, 4);
    expect(result.totalCost).toBe(2.5); // 4×0.5 + 2×0.25
    expect(result.costPerServing).toBe(0.63); // 2.5/4 rounded
    expect(result.missingPrices).toHaveLength(0);
    expect(result.coverage).toBe(100);
  });

  it('tracks missing prices', () => {
    const ingredients = [
      makeIngredientRow({ id: '1', name: 'butter', amount: 4, unit: 'oz' }),
      makeIngredientRow({ id: '2', name: 'saffron', amount: 1, unit: 'pinch' }),
    ];
    const prices = [
      makePriceRow({ ingredientName: 'butter', costPerUnit: 0.5, costUnit: 'oz' }),
    ];
    const result = calculateRecipeCost(ingredients, [4, 1], prices, 4);
    expect(result.missingPrices).toEqual(['saffron']);
    expect(result.coverage).toBe(50);
  });

  it('handles zero servings', () => {
    const result = calculateRecipeCost([], [], [], 0);
    expect(result.costPerServing).toBe(0);
    expect(result.totalCost).toBe(0);
  });

  it('handles empty ingredients', () => {
    const result = calculateRecipeCost([], [], [], 4);
    expect(result.totalCost).toBe(0);
    expect(result.coverage).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats to 2 decimal places with dollar sign', () => {
    expect(formatCurrency(5)).toBe('$5.00');
    expect(formatCurrency(3.5)).toBe('$3.50');
    expect(formatCurrency(0.99)).toBe('$0.99');
  });
});
