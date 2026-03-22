import { detectAllergens, getAllergenById } from '../lib/allergens';

describe('detectAllergens', () => {
  it('detects dairy allergen', () => {
    const result = detectAllergens(['butter', 'sugar', 'flour']);
    const ids = result.map((a) => a.id);
    expect(ids).toContain('dairy');
    expect(ids).toContain('gluten'); // flour
  });

  it('detects multiple allergens', () => {
    const result = detectAllergens(['shrimp', 'peanut butter', 'soy sauce', 'egg']);
    const ids = result.map((a) => a.id);
    expect(ids).toContain('shellfish');
    expect(ids).toContain('peanuts');
    expect(ids).toContain('soy');
    expect(ids).toContain('eggs');
    expect(ids).toContain('gluten'); // soy sauce contains gluten keyword
  });

  it('detects tree nuts', () => {
    const result = detectAllergens(['almond flour', 'sugar']);
    const ids = result.map((a) => a.id);
    expect(ids).toContain('nuts');
  });

  it('detects sesame', () => {
    const result = detectAllergens(['tahini', 'chickpeas', 'lemon juice']);
    const ids = result.map((a) => a.id);
    expect(ids).toContain('sesame');
  });

  it('detects fish', () => {
    const result = detectAllergens(['salmon fillet', 'lemon', 'dill']);
    const ids = result.map((a) => a.id);
    expect(ids).toContain('fish');
  });

  it('returns empty array for allergen-free ingredients', () => {
    const result = detectAllergens(['rice', 'water', 'salt', 'pepper']);
    expect(result).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const result = detectAllergens(['MILK', 'Eggs']);
    const ids = result.map((a) => a.id);
    expect(ids).toContain('dairy');
    expect(ids).toContain('eggs');
  });

  it('does not duplicate allergens', () => {
    const result = detectAllergens(['milk', 'cream', 'cheese', 'butter']);
    const dairyCount = result.filter((a) => a.id === 'dairy').length;
    expect(dairyCount).toBe(1);
  });

  it('handles empty input', () => {
    expect(detectAllergens([])).toHaveLength(0);
  });
});

describe('getAllergenById', () => {
  it('returns allergen info for valid id', () => {
    const dairy = getAllergenById('dairy');
    expect(dairy).toBeDefined();
    expect(dairy!.name).toBe('Dairy');
  });

  it('returns undefined for invalid id', () => {
    expect(getAllergenById('nonexistent')).toBeUndefined();
  });
});
