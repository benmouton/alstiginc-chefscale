// Parses natural-language purchase descriptions into structured cost data.
//
// Strategy: try a local regex first (handles 90%+ of real-world inputs like
// "$30 for a 50 lb sack" or "$5/lb"). Falls back to the server AI endpoint
// for ambiguous cases. Returns null only if both paths fail — the caller
// shows "fill manually" guidance.

export interface ParsedPrice {
  purchaseCost: number;
  amount: number;
  unit: string;
  container: string | null;
}

export interface ParsePriceOptions {
  signal?: AbortSignal;
  /** API base URL — pass in from the caller so tests can mock. */
  apiBase?: string;
  /** Optional ingredient name to give the model more context. */
  ingredientName?: string;
}

// Unit synonym map — normalizes common variations to canonical keys.
const UNIT_SYNONYMS: Record<string, string> = {
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilo: 'kg', kilogram: 'kg', kilograms: 'kg',
  gal: 'gallon', gallon: 'gallon', gallons: 'gallon',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  cup: 'cup', cups: 'cup',
  qt: 'quart', quart: 'quart', quarts: 'quart',
  pt: 'pint', pint: 'pint', pints: 'pint',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  ea: 'each', each: 'each', pc: 'each', piece: 'each', pieces: 'each',
  ct: 'each', count: 'each',
  doz: 'dozen', dozen: 'dozen',
  can: 'can', cans: 'can',
  bottle: 'bottle', bottles: 'bottle', btl: 'bottle',
  jar: 'jar', jars: 'jar',
  bag: 'bag', bags: 'bag',
  box: 'box', boxes: 'box',
  case: 'case', cases: 'case', cs: 'case',
  sack: 'sack', sacks: 'sack',
  bunch: 'bunch', bunches: 'bunch',
  head: 'head', heads: 'head',
  loaf: 'loaf', loaves: 'loaf',
  package: 'package', packages: 'package', pkg: 'package',
  roll: 'roll', rolls: 'roll',
  slice: 'slice', slices: 'slice',
  stick: 'stick', sticks: 'stick',
  clove: 'clove', cloves: 'clove',
  sprig: 'sprig', sprigs: 'sprig',
  stalk: 'stalk', stalks: 'stalk',
  'fl oz': 'fl_oz', 'fl_oz': 'fl_oz', 'fluid ounce': 'fl_oz',
};

function normalizeUnit(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  return UNIT_SYNONYMS[lower] || null;
}

/**
 * Try to parse locally with regex patterns. Handles:
 *   "$150 for a 30lb sack"   → { purchaseCost: 150, amount: 30, unit: 'lb', container: '30lb sack' }
 *   "$5 per lb"              → { purchaseCost: 5, amount: 1, unit: 'lb', container: null }
 *   "$30 for 50 lbs"         → { purchaseCost: 30, amount: 50, unit: 'lb', container: null }
 *   "30 bucks for a 50 lb sack" → same as first
 *   "$42.03 / 60 ct"         → { purchaseCost: 42.03, amount: 60, unit: 'each', container: null }
 */
export function parseLocal(description: string): ParsedPrice | null {
  const s = description.trim();
  if (s.length < 3) return null;

  // Extract dollar amount: "$150", "$42.03", "150 dollars", "30 bucks"
  let cost: number | null = null;
  const dollarMatch = s.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  if (dollarMatch) {
    cost = parseFloat(dollarMatch[1].replace(/,/g, ''));
  } else {
    const wordsMatch = s.match(/([\d,]+(?:\.\d+)?)\s*(?:dollars?|bucks?)/i);
    if (wordsMatch) {
      cost = parseFloat(wordsMatch[1].replace(/,/g, ''));
    }
  }
  if (cost === null || !(cost > 0)) return null;

  // Pattern 1: "$X for [a] N unit [container-word(s)]"
  //   "$150 for a 30lb sack", "$30 for 50 lbs", "$150 for a 30 lb sack"
  const forMatch = s.match(/for\s+(?:a\s+)?([\d,.]+)\s*([a-z_]+)\s*(.*)?$/i);
  if (forMatch) {
    const amount = parseFloat(forMatch[1].replace(/,/g, ''));
    const rawUnit = forMatch[2].trim();
    const rest = (forMatch[3] || '').trim();

    const unit = normalizeUnit(rawUnit);
    if (unit && amount > 0) {
      // If there are extra words after the unit ("sack", "bag", etc.), the full
      // substring after "for [a]" is the container descriptor.
      const fullDesc = s.replace(/.*for\s+(?:a\s+)?/i, '').trim();
      const container = rest.length > 0 ? fullDesc : null;
      return { purchaseCost: cost, amount, unit, container };
    }
  }

  // Pattern 2: "$X per unit" or "$X/unit"
  const perMatch = s.match(/(?:per|\/)\s*([a-z_\s]+)/i);
  if (perMatch) {
    const unit = normalizeUnit(perMatch[1].trim());
    if (unit) {
      return { purchaseCost: cost, amount: 1, unit, container: null };
    }
  }

  // Pattern 3: "$X [/] N unit" — e.g. "$42.03 / 60 ct"
  const slashAmountMatch = s.match(/[\$/]\s*([\d,.]+)\s*([a-z_\s]+)/i);
  if (slashAmountMatch && slashAmountMatch[1] !== String(cost)) {
    const amount = parseFloat(slashAmountMatch[1].replace(/,/g, ''));
    const unit = normalizeUnit(slashAmountMatch[2].trim());
    if (unit && amount > 0) {
      return { purchaseCost: cost, amount, unit, container: null };
    }
  }

  return null;
}

/** Parse a freetext description. Tries local regex first, then falls back
 *  to the server AI endpoint. Returns null on total failure so the UI
 *  can prompt for manual entry. */
export async function parsePriceDescription(
  description: string,
  options: ParsePriceOptions = {}
): Promise<ParsedPrice | null> {
  const { signal, apiBase = '', ingredientName } = options;

  if (!description || description.trim().length < 3) return null;

  // Fast path: local regex handles ~90% of real inputs.
  const local = parseLocal(description);
  if (local) return local;

  // Slow path: server AI for ambiguous cases.
  try {
    const res = await fetch(`${apiBase}/api/parse-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: description.trim(),
        ingredientName: ingredientName?.trim() || undefined,
      }),
      signal,
    });

    if (!res.ok) {
      console.log('[priceParse] server returned', res.status);
      return null;
    }

    const data = await res.json();

    if (
      typeof data?.purchaseCost !== 'number' ||
      typeof data?.amount !== 'number' ||
      typeof data?.unit !== 'string' ||
      !(data.purchaseCost > 0) ||
      !(data.amount > 0)
    ) {
      console.log('[priceParse] server returned invalid shape:', data);
      return null;
    }

    return {
      purchaseCost: data.purchaseCost,
      amount: data.amount,
      unit: data.unit,
      container: typeof data.container === 'string' && data.container.trim() ? data.container.trim() : null,
    };
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      console.log('[priceParse] request failed:', e?.message || e);
    }
    return null;
  }
}
