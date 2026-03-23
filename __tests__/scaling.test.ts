import {
  scaleAmount,
  scaleQuantity,
  convertUnit,
  formatQuantity,
  getScaleFactor,
  getUnitAbbreviation,
  MAX_SCALE_FACTOR,
} from '../lib/scaling';

describe('scaleAmount', () => {
  it('scales a simple ingredient up and converts units', () => {
    // 2 cups × 2 = 4 cups → triggers cup→quart conversion (threshold 4)
    const result = scaleAmount(2, 4, 8, 'cup', true);
    expect(result.amount).toBe(1);
    expect(result.unit).toBe('quart');
    expect(result.originalDisplay).toContain('was');
  });

  it('scales a simple ingredient down', () => {
    const result = scaleAmount(4, 4, 2, 'cup', true);
    expect(result.amount).toBe(2);
    expect(result.unit).toBe('cup');
  });

  it('returns original when not scalable', () => {
    const result = scaleAmount(1, 4, 8, 'pinch', false);
    expect(result.amount).toBe(1);
  });

  it('returns original when originalServings is 0', () => {
    const result = scaleAmount(2, 0, 8, 'cup', true);
    expect(result.amount).toBe(2);
  });

  it('does not show originalDisplay when servings unchanged', () => {
    const result = scaleAmount(2, 4, 4, 'cup', true);
    expect(result.originalDisplay).toBe('');
  });

  it('converts tsp to tbsp when threshold met', () => {
    // 3 tsp × (8/4) = 6 tsp → should convert to 2 tbsp
    const result = scaleAmount(3, 4, 8, 'tsp', true);
    expect(result.unit).toBe('tbsp');
  });

  it('converts tbsp to cup when threshold met', () => {
    // 8 tbsp × 2 = 16 tbsp → 1 cup
    const result = scaleAmount(8, 4, 8, 'tbsp', true);
    expect(result.unit).toBe('cup');
  });

  it('converts oz to lb when threshold met', () => {
    // 8 oz × 2 = 16 oz → 1 lb
    const result = scaleAmount(8, 4, 8, 'oz', true);
    expect(result.unit).toBe('lb');
  });

  it('converts small cup amounts down to tbsp', () => {
    // 1 cup × (1/8) = 0.125 cup → should convert down to tbsp
    const result = scaleAmount(1, 8, 1, 'cup', true);
    expect(result.unit).toBe('tbsp');
  });

  it('rounds count units up', () => {
    // 2 each × (3/4) = 1.5 → should ceil to 2
    const result = scaleAmount(2, 4, 3, 'each', true);
    expect(result.amount).toBe(2);
  });

  it('returns original when targetServings is 0', () => {
    const result = scaleAmount(2, 4, 0, 'cup', true);
    expect(result.amount).toBe(2);
    expect(result.originalDisplay).toBe('');
  });

  it('caps scale factor at MAX_SCALE_FACTOR', () => {
    // 1 cup × (1000/1) = 1000x but capped at 25x → 25 cups → 6.25 quarts
    const result = scaleAmount(1, 1, 1000, 'cup', true);
    expect(result.amount).toBeLessThanOrEqual(MAX_SCALE_FACTOR);
  });

  it('avoids floating-point accumulation in sequential conversions', () => {
    // 48 tsp should convert directly to cup (not tsp→tbsp→cup sequentially)
    const result = scaleAmount(24, 4, 8, 'tsp', true);
    // 48 tsp = 1 cup exactly (48/48)
    expect(result.unit).toBe('cup');
    expect(result.amount).toBe(1);
  });
});

describe('scaleQuantity', () => {
  it('scales a quantity by ratio', () => {
    expect(scaleQuantity(100, 4, 8)).toBe(200);
  });

  it('returns original if originalServings is 0', () => {
    expect(scaleQuantity(100, 0, 8)).toBe(100);
  });

  it('scales down correctly', () => {
    expect(scaleQuantity(10, 4, 2)).toBe(5);
  });
});

describe('convertUnit', () => {
  it('converts tsp to tbsp', () => {
    const result = convertUnit(3, 'tsp', 'tbsp');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(1, 0);
  });

  it('converts cup to ml', () => {
    const result = convertUnit(1, 'cup', 'ml');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(236.588, 0);
  });

  it('converts oz to lb', () => {
    const result = convertUnit(16, 'oz', 'lb');
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(1, 0);
  });

  it('converts g to kg', () => {
    const result = convertUnit(1000, 'g', 'kg');
    expect(result).toBe(1);
  });

  it('returns null for unknown units', () => {
    expect(convertUnit(1, 'foo', 'bar')).toBeNull();
  });

  it('returns null for cross-category conversion', () => {
    expect(convertUnit(1, 'cup', 'oz')).toBeNull();
  });
});

describe('formatQuantity', () => {
  it('formats whole numbers', () => {
    expect(formatQuantity(3)).toBe('3');
  });

  it('formats zero', () => {
    expect(formatQuantity(0)).toBe('0');
  });

  it('formats common fractions', () => {
    expect(formatQuantity(0.5)).toBe('½');
    expect(formatQuantity(0.25)).toBe('¼');
    expect(formatQuantity(0.75)).toBe('¾');
    expect(formatQuantity(0.333)).toBe('⅓');
    // 0.667 is within tolerance of ⅝ (0.625) which appears first in FRACTION_MAP
    expect(formatQuantity(0.667)).toBe('⅝');
  });

  it('formats mixed numbers with fractions', () => {
    expect(formatQuantity(1.5)).toBe('1½');
    expect(formatQuantity(2.25)).toBe('2¼');
  });

  it('formats decimals that are not common fractions', () => {
    // Values far from any fraction in FRACTION_MAP get decimal format
    expect(formatQuantity(1.07)).toBe('1.07');
  });

  it('formats negative numbers', () => {
    expect(formatQuantity(-1.5)).toBe('-1.50');
  });
});

describe('getScaleFactor', () => {
  it('returns correct factor', () => {
    expect(getScaleFactor(4, 8)).toBe(2);
  });

  it('returns 1 when originalServings is 0', () => {
    expect(getScaleFactor(0, 8)).toBe(1);
  });

  it('returns 1 when targetServings is 0', () => {
    expect(getScaleFactor(4, 0)).toBe(1);
  });

  it('caps at MAX_SCALE_FACTOR', () => {
    expect(getScaleFactor(1, 100)).toBe(MAX_SCALE_FACTOR);
  });
});

describe('getUnitAbbreviation', () => {
  it('returns abbreviation for known units', () => {
    expect(getUnitAbbreviation('cup')).toBe('cup');
    expect(getUnitAbbreviation('tbsp')).toBe('tbsp');
    expect(getUnitAbbreviation('oz')).toBe('oz');
    expect(getUnitAbbreviation('kg')).toBe('kg');
  });

  it('returns unit string for unknown units', () => {
    expect(getUnitAbbreviation('unknown')).toBe('unknown');
  });
});
