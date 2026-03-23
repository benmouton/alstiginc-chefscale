import { buildPrepSheet, type PrepSheetRecipe } from '../lib/prepSheet';
import type { RecipeWithDetails } from '../lib/database';

function makeRecipe(
  name: string,
  baseServings: number,
  ingredients: Array<{ name: string; amount: number; unit: string }>
): RecipeWithDetails {
  return {
    id: name,
    name,
    baseServings,
    baseYieldUnit: 'servings',
    category: 'test',
    ingredients: ingredients.map((ing, i) => ({
      id: `${name}-${i}`,
      recipeId: name,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: '',
      costPerUnit: null,
      costUnit: null,
      fdcId: null,
      isOptional: 0,
      isScalable: 1,
      prepNote: '',
      sortOrder: i,
      yieldPercent: 100,
      subrecipeId: '',
    })),
    instructions: [],
    photos: [],
    description: '',
    tags: '',
    prepTime: 0,
    cookTime: 0,
    imageUri: '',
    notes: '',
    source: '',
    station: '',
    dietaryFlags: '',
    createdAt: '',
    updatedAt: '',
    isFavorite: 0,
    parentRecipeId: '',
    variationLabel: '',
  } as RecipeWithDetails;
}

describe('buildPrepSheet', () => {
  it('aggregates same ingredient with same unit', () => {
    const selections: PrepSheetRecipe[] = [
      { recipe: makeRecipe('A', 1, [{ name: 'Salt', amount: 1, unit: 'tsp' }]), multiplier: 1 },
      { recipe: makeRecipe('B', 1, [{ name: 'Salt', amount: 2, unit: 'tsp' }]), multiplier: 1 },
    ];
    const result = buildPrepSheet(selections);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(3);
    expect(result[0].hasUnitConflict).toBe(false);
  });

  it('converts compatible units and aggregates', () => {
    const selections: PrepSheetRecipe[] = [
      { recipe: makeRecipe('A', 1, [{ name: 'Butter', amount: 1, unit: 'cup' }]), multiplier: 1 },
      { recipe: makeRecipe('B', 1, [{ name: 'Butter', amount: 8, unit: 'tbsp' }]), multiplier: 1 },
    ];
    const result = buildPrepSheet(selections);
    expect(result).toHaveLength(1);
    expect(result[0].hasUnitConflict).toBe(false);
  });

  it('flags unit conflicts for incompatible units', () => {
    const selections: PrepSheetRecipe[] = [
      { recipe: makeRecipe('A', 1, [{ name: 'Salt', amount: 1, unit: 'tsp' }]), multiplier: 1 },
      { recipe: makeRecipe('B', 1, [{ name: 'Salt', amount: 50, unit: 'g' }]), multiplier: 1 },
    ];
    const result = buildPrepSheet(selections);
    // Should create 2 separate entries since tsp (volume) and g (weight) are incompatible
    expect(result.length).toBe(2);
    expect(result[0].hasUnitConflict).toBe(true);
    expect(result[1].hasUnitConflict).toBe(true);
    // Both should have the same display name
    expect(result[0].name).toBe('Salt');
    expect(result[1].name).toBe('Salt');
  });

  it('does not flag ingredients without conflicts', () => {
    const selections: PrepSheetRecipe[] = [
      {
        recipe: makeRecipe('A', 1, [
          { name: 'Salt', amount: 1, unit: 'tsp' },
          { name: 'Butter', amount: 1, unit: 'cup' },
        ]),
        multiplier: 1,
      },
    ];
    const result = buildPrepSheet(selections);
    expect(result).toHaveLength(2);
    result.forEach((r) => expect(r.hasUnitConflict).toBe(false));
  });

  it('scales by multiplier', () => {
    const selections: PrepSheetRecipe[] = [
      { recipe: makeRecipe('A', 4, [{ name: 'Flour', amount: 2, unit: 'cup' }]), multiplier: 3 },
    ];
    const result = buildPrepSheet(selections);
    expect(result).toHaveLength(1);
    // 2 cups * 3x = 6 cups, smart conversion may upconvert to 1.5 quarts
    expect(result[0].amount).toBe(1.5);
    expect(result[0].unit).toBe('quart');
  });

  it('tracks sources correctly', () => {
    const selections: PrepSheetRecipe[] = [
      { recipe: makeRecipe('Soup', 1, [{ name: 'Onion', amount: 1, unit: 'each' }]), multiplier: 1 },
      { recipe: makeRecipe('Salad', 1, [{ name: 'Onion', amount: 2, unit: 'each' }]), multiplier: 1 },
    ];
    const result = buildPrepSheet(selections);
    expect(result).toHaveLength(1);
    expect(result[0].sources).toEqual(expect.arrayContaining(['Soup', 'Salad']));
  });
});
