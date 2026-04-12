// Client-side helper that calls the server's /api/parse-price endpoint
// to turn natural-language purchase descriptions into structured cost data.
//
// Works offline: returns null on any error (network, non-JSON, invalid
// shape). Callers should fall back to manual entry when null is returned.

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

/** Parse a freetext description via the server endpoint. Returns null on
 *  any failure so the UI can gracefully fall back to manual entry. */
export async function parsePriceDescription(
  description: string,
  options: ParsePriceOptions = {}
): Promise<ParsedPrice | null> {
  const { signal, apiBase = '', ingredientName } = options;

  if (!description || description.trim().length < 3) return null;

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
    // AbortError is expected when the user cancels — stay silent.
    if (e?.name !== 'AbortError') {
      console.log('[priceParse] request failed:', e?.message || e);
    }
    return null;
  }
}
