import { suggestUnitsForIngredient } from '../lib/ingredientUnitHints';

describe('suggestUnitsForIngredient', () => {
  test('exact single-word match', () => {
    expect(suggestUnitsForIngredient('flour').primary).toBe('lb');
    expect(suggestUnitsForIngredient('butter').primary).toBe('lb');
    expect(suggestUnitsForIngredient('milk').primary).toBe('gallon');
    expect(suggestUnitsForIngredient('chicken').primary).toBe('lb');
  });

  test('case-insensitive', () => {
    expect(suggestUnitsForIngredient('FLOUR').primary).toBe('lb');
    expect(suggestUnitsForIngredient('Butter').primary).toBe('lb');
  });

  test('strips common descriptors', () => {
    expect(suggestUnitsForIngredient('unsalted butter').primary).toBe('lb');
    expect(suggestUnitsForIngredient('all-purpose flour').primary).toBe('lb');
    expect(suggestUnitsForIngredient('extra-virgin olive oil').primary).toBe('fl_oz');
    expect(suggestUnitsForIngredient('whole milk').primary).toBe('gallon');
  });

  test('two-word phrase matches via window lookup', () => {
    expect(suggestUnitsForIngredient('olive oil').primary).toBe('fl_oz');
    expect(suggestUnitsForIngredient('heavy cream').primary).toBe('quart');
    expect(suggestUnitsForIngredient('black pepper').primary).toBe('oz');
    expect(suggestUnitsForIngredient('tomato paste').primary).toBe('can');
  });

  test('single-word fallback when 2-word lookup fails', () => {
    // "fresh basil" → strip "fresh" → "basil" → bunch
    expect(suggestUnitsForIngredient('fresh basil').primary).toBe('bunch');
    // "chopped onions" → strip "chopped" → "onions" → lb
    expect(suggestUnitsForIngredient('chopped onions').primary).toBe('lb');
  });

  test('returns fallback for unknown ingredients', () => {
    const hint = suggestUnitsForIngredient('dragonfruit');
    expect(hint.primary).toBe('each');
    expect(hint.alternates).toContain('lb');
  });

  test('matches a known word inside a longer phrase', () => {
    // If any word in the phrase is a known ingredient, we should use its hint.
    // "quinoa flour" → matches "flour" even though "quinoa" isn't in the dict.
    const hint = suggestUnitsForIngredient('quinoa flour');
    expect(hint.primary).toBe('lb');
  });

  test('returns fallback for empty or invalid input', () => {
    expect(suggestUnitsForIngredient('').primary).toBe('each');
    expect(suggestUnitsForIngredient('   ').primary).toBe('each');
    // @ts-expect-error testing runtime safety
    expect(suggestUnitsForIngredient(null).primary).toBe('each');
    // @ts-expect-error testing runtime safety
    expect(suggestUnitsForIngredient(undefined).primary).toBe('each');
  });

  test('pepper alone = produce, "black pepper" = spice', () => {
    // Pepper by itself is fresh produce in a restaurant pantry.
    expect(suggestUnitsForIngredient('pepper').primary).toBe('lb');
    // Black/white pepper is the ground spice.
    expect(suggestUnitsForIngredient('black pepper').primary).toBe('oz');
    expect(suggestUnitsForIngredient('white pepper').primary).toBe('oz');
  });

  test('herb suggestions use "bunch" or "sprig"', () => {
    expect(suggestUnitsForIngredient('basil').primary).toBe('bunch');
    expect(suggestUnitsForIngredient('parsley').primary).toBe('bunch');
    expect(suggestUnitsForIngredient('rosemary').primary).toBe('sprig');
    expect(suggestUnitsForIngredient('thyme').primary).toBe('sprig');
  });

  test('eggs suggest dozen', () => {
    expect(suggestUnitsForIngredient('eggs').primary).toBe('dozen');
    expect(suggestUnitsForIngredient('egg').primary).toBe('dozen');
    expect(suggestUnitsForIngredient('large eggs').primary).toBe('dozen');
  });

  test('alternates list contains distinct units', () => {
    const hint = suggestUnitsForIngredient('flour');
    const all = [hint.primary, ...hint.alternates];
    expect(new Set(all).size).toBe(all.length); // no duplicates
  });
});
