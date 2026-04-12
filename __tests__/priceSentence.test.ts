import { buildCostSentence, formatCurrency } from '../lib/priceSentence';

describe('formatCurrency', () => {
  test('formats whole dollars to 2dp', () => {
    expect(formatCurrency(5)).toBe('$5.00');
    expect(formatCurrency(42.03)).toBe('$42.03');
  });

  test('formats sub-dollar amounts', () => {
    expect(formatCurrency(0.6)).toBe('$0.60');
    expect(formatCurrency(0.005)).toBe('$0.01'); // rounds
  });

  test('handles invalid input gracefully', () => {
    expect(formatCurrency(NaN)).toBe('$0.00');
    expect(formatCurrency(Infinity)).toBe('$0.00');
  });
});

describe('buildCostSentence', () => {
  test('simple case: $30 for 50 lb', () => {
    const s = buildCostSentence({ purchaseCost: 30, amount: 50, unit: 'lb' });
    expect(s.rate).toBe('$0.60 / lb');
    expect(s.breakdown).toBe('$30.00 for 50 lb');
    expect(s.costPerUnit).toBe(0.6);
  });

  test('with container descriptor: "50 lb sack"', () => {
    const s = buildCostSentence({
      purchaseCost: 30,
      amount: 50,
      unit: 'lb',
      container: '50 lb sack',
    });
    expect(s.rate).toBe('$0.60 / lb');
    expect(s.breakdown).toBe('$30.00 for a 50 lb sack');
  });

  test('rounds currency display to 2dp but preserves precise costPerUnit', () => {
    // 42.03 / 60 = 0.7005 — display rounds, stored value stays precise
    const s = buildCostSentence({ purchaseCost: 42.03, amount: 60, unit: 'ct' });
    expect(s.rate).toBe('$0.70 / ct');
    expect(s.costPerUnit).toBeCloseTo(0.7005, 4);
  });

  test('high-value per-unit: $5 per lb butter', () => {
    const s = buildCostSentence({ purchaseCost: 5, amount: 1, unit: 'lb' });
    expect(s.rate).toBe('$5.00 / lb');
    expect(s.breakdown).toBe('$5.00 for 1 lb');
    expect(s.costPerUnit).toBe(5);
  });

  test('trims whitespace around unit', () => {
    const s = buildCostSentence({ purchaseCost: 10, amount: 2, unit: '  lb  ' });
    expect(s.rate).toBe('$5.00 / lb');
  });

  test('empty output when cost is missing', () => {
    const s = buildCostSentence({ purchaseCost: 0, amount: 50, unit: 'lb' });
    expect(s.rate).toBe('');
    expect(s.breakdown).toBe('');
    expect(s.costPerUnit).toBe(null);
  });

  test('empty output when amount is missing or zero', () => {
    const s = buildCostSentence({ purchaseCost: 30, amount: 0, unit: 'lb' });
    expect(s.costPerUnit).toBe(null);
  });

  test('empty output when unit is blank', () => {
    const s = buildCostSentence({ purchaseCost: 30, amount: 50, unit: '' });
    expect(s.costPerUnit).toBe(null);
  });

  test('empty output when inputs are NaN', () => {
    const s = buildCostSentence({ purchaseCost: NaN, amount: 50, unit: 'lb' });
    expect(s.costPerUnit).toBe(null);
  });

  test('ignores blank container string', () => {
    const s = buildCostSentence({
      purchaseCost: 30,
      amount: 50,
      unit: 'lb',
      container: '   ',
    });
    expect(s.breakdown).toBe('$30.00 for 50 lb');
  });
});
