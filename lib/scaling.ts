import { UNITS } from '@/constants/units';

const FRACTION_MAP: [number, string][] = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [0.333, '⅓'],
  [0.375, '⅜'],
  [0.5, '½'],
  [0.625, '⅝'],
  [0.667, '⅔'],
  [0.75, '¾'],
  [0.875, '⅞'],
];

export interface ScaleResult {
  amount: number;
  unit: string;
  display: string;
  originalDisplay: string;
}

export function scaleAmount(
  originalAmount: number,
  originalServings: number,
  targetServings: number,
  unit: string,
  isScalable: boolean
): ScaleResult {
  if (!isScalable || originalServings <= 0) {
    return {
      amount: originalAmount,
      unit,
      display: `${formatQuantity(originalAmount)} ${getUnitAbbreviation(unit)}`,
      originalDisplay: '',
    };
  }

  let scaledAmount = originalAmount * (targetServings / originalServings);
  let finalUnit = unit;

  const converted = applySmartConversion(scaledAmount, unit);
  scaledAmount = converted.amount;
  finalUnit = converted.unit;

  scaledAmount = roundForUnit(scaledAmount, finalUnit);

  const display = `${formatQuantity(scaledAmount)} ${getUnitAbbreviation(finalUnit)}`;
  const isChanged = targetServings !== originalServings;
  const originalDisplay = isChanged
    ? `was ${formatQuantity(originalAmount)} ${getUnitAbbreviation(unit)}`
    : '';

  return { amount: scaledAmount, unit: finalUnit, display, originalDisplay };
}

function applySmartConversion(amount: number, unit: string): { amount: number; unit: string } {
  const conversions: { from: string; to: string; threshold: number }[] = [
    { from: 'tsp', to: 'cup', threshold: 48 },
    { from: 'tsp', to: 'tbsp', threshold: 3 },
    { from: 'tbsp', to: 'cup', threshold: 16 },
    { from: 'cup', to: 'quart', threshold: 4 },
    { from: 'quart', to: 'gallon', threshold: 4 },
    { from: 'oz', to: 'lb', threshold: 16 },
    { from: 'g', to: 'kg', threshold: 1000 },
    { from: 'ml', to: 'l', threshold: 1000 },
    { from: 'fl_oz', to: 'cup', threshold: 8 },
  ];

  const downConversions: { from: string; to: string; threshold: number; factor: number }[] = [
    { from: 'cup', to: 'tbsp', threshold: 0.25, factor: 16 },
    { from: 'tbsp', to: 'tsp', threshold: 1, factor: 3 },
  ];

  let currentAmount = amount;
  let currentUnit = unit;

  for (const conv of conversions) {
    if (currentUnit === conv.from && currentAmount >= conv.threshold) {
      const converted = convertUnit(currentAmount, conv.from, conv.to);
      if (converted !== null) {
        currentAmount = converted;
        currentUnit = conv.to;
      }
    }
  }

  for (const conv of downConversions) {
    if (currentUnit === conv.from && currentAmount < conv.threshold && currentAmount > 0) {
      const converted = convertUnit(currentAmount, conv.from, conv.to);
      if (converted !== null) {
        currentAmount = converted;
        currentUnit = conv.to;
      }
    }
  }

  return { amount: currentAmount, unit: currentUnit };
}

function roundForUnit(amount: number, unit: string): number {
  const countUnits = ['each', 'piece', 'dozen', 'can', 'bottle', 'package', 'head', 'stalk', 'bunch', 'sprig', 'clove'];
  if (countUnits.includes(unit)) {
    return Math.ceil(amount);
  }

  if (unit === 'cup' || unit === 'quart' || unit === 'gallon') {
    return Math.round(amount * 4) / 4;
  }

  if (unit === 'tbsp' || unit === 'tsp') {
    return Math.round(amount * 2) / 2;
  }

  if (unit === 'oz' || unit === 'lb' || unit === 'fl_oz') {
    return Math.round(amount * 4) / 4;
  }

  if (unit === 'g') {
    return amount >= 10 ? Math.round(amount) : Math.round(amount * 10) / 10;
  }

  if (unit === 'kg' || unit === 'l') {
    return Math.round(amount * 100) / 100;
  }

  if (unit === 'ml') {
    return Math.round(amount);
  }

  return Math.round(amount * 100) / 100;
}

export function scaleQuantity(quantity: number, originalServings: number, targetServings: number): number {
  if (originalServings <= 0) return quantity;
  const factor = targetServings / originalServings;
  return Math.round(quantity * factor * 1000) / 1000;
}

export function convertUnit(value: number, fromUnit: string, toUnit: string): number | null {
  const from = UNITS[fromUnit];
  const to = UNITS[toUnit];

  if (!from || !to) return null;
  if (from.category !== to.category) return null;
  if (from.baseName !== to.baseName) return null;

  const baseValue = value * from.toBase;
  return Math.round((baseValue / to.toBase) * 1000) / 1000;
}

export function formatQuantity(value: number): string {
  if (value === 0) return '0';
  if (value < 0) return value.toFixed(2);

  const whole = Math.floor(value);
  const decimal = value - whole;

  if (decimal < 0.05) {
    return whole.toString();
  }

  for (const [frac, label] of FRACTION_MAP) {
    if (Math.abs(decimal - frac) < 0.05) {
      return whole > 0 ? `${whole}${label}` : label;
    }
  }

  return value % 1 === 0 ? value.toString() : value.toFixed(2);
}

export function getScaleFactor(originalServings: number, targetServings: number): number {
  if (originalServings <= 0) return 1;
  return targetServings / originalServings;
}

export function getUnitAbbreviation(unit: string): string {
  const unitDef = UNITS[unit];
  return unitDef ? unitDef.abbreviation : unit;
}
