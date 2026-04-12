// Human-friendly rendering of a purchase into a validation sentence.
// Used by the purchase cost editor to confirm the user's math back to them.
//
// Two formats:
//   rate:      "$0.60 / lb"               — the answer, big and reassuring
//   breakdown: "$30.00 for a 50 lb sack"  — the inputs, small and verifiable

export interface PurchaseInput {
  /** What the user paid (dollars). */
  purchaseCost: number;
  /** How much they got for that price (in `unit`). */
  amount: number;
  /** Base unit, e.g. "lb", "fl_oz", "each". */
  unit: string;
  /** Optional free-text descriptor, e.g. "50 lb sack", "case of 6". */
  container?: string;
}

export interface CostSentence {
  /** Big line — the rate. */
  rate: string;
  /** Small line — the inputs. */
  breakdown: string;
  /** Raw cost-per-unit value for storage (null if inputs are invalid). */
  costPerUnit: number | null;
}

/** Format a number as USD to 2dp, with a ¢ fallback for sub-dollar rates. */
export function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

/** Build the two-line sentence for a purchase. Empty-safe — if inputs are
 *  invalid, returns blank strings and null cost so the UI can gate on it. */
export function buildCostSentence(input: PurchaseInput): CostSentence {
  const { purchaseCost, amount, unit, container } = input;

  const costValid = Number.isFinite(purchaseCost) && purchaseCost > 0;
  const amountValid = Number.isFinite(amount) && amount > 0;
  const unitValid = typeof unit === 'string' && unit.trim().length > 0;

  if (!costValid || !amountValid || !unitValid) {
    return { rate: '', breakdown: '', costPerUnit: null };
  }

  const costPerUnit = purchaseCost / amount;
  const unitLabel = unit.trim();
  const rate = `${formatCurrency(costPerUnit)} / ${unitLabel}`;

  let breakdown: string;
  if (container && container.trim()) {
    breakdown = `${formatCurrency(purchaseCost)} for a ${container.trim()}`;
  } else {
    breakdown = `${formatCurrency(purchaseCost)} for ${amount} ${unitLabel}`;
  }

  return { rate, breakdown, costPerUnit };
}
