import { UNITS } from '@/constants/units';

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

  const fractions: [number, string][] = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.375, '3/8'],
    [0.5, '1/2'],
    [0.625, '5/8'],
    [0.667, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8'],
  ];

  const whole = Math.floor(value);
  const decimal = value - whole;

  if (decimal < 0.05) {
    return whole.toString();
  }

  for (const [frac, label] of fractions) {
    if (Math.abs(decimal - frac) < 0.05) {
      return whole > 0 ? `${whole} ${label}` : label;
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
