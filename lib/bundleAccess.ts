// ALSTIG Bundle access for ChefScale.
//
// The bundle is sold on TRC web (restaurantai.consulting) via Stripe.
// Subscribers receive 5 promo codes by email — one per ALSTIG native app.
// In ChefScale, the user enters their code in Settings; on success we
// store the expiry locally and the subscription store treats them as
// premium until expiry.
//
// Apple compliance: this app does NOT promote, link to, or describe the
// bundle purchase. The Settings UI says "Have a code? Enter it." — no
// "Subscribe at..." language. Bundle redemption is recognition of an
// external purchase, not promotion of one. Per-app RevenueCat IAP
// remains the in-app purchase path for non-bundle users.

import AsyncStorage from "@react-native-async-storage/async-storage";

const TRC_BUNDLE_REDEEM_URL =
  "https://restaurantai.consulting/api/bundle/redeem-code";
const APP_SLUG = "chefscale";
const BUNDLE_EXPIRY_KEY = "@chefscale_bundle_expires_at";

export type RedemptionResult =
  | { success: true; expiresAt: Date }
  | {
      success: false;
      reason:
        | "bad_request"
        | "not_found"
        | "already_redeemed"
        | "expired"
        | "rate_limited"
        | "network_error";
    };

export async function redeemBundleCode(code: string): Promise<RedemptionResult> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { success: false, reason: "bad_request" };
  }
  try {
    const res = await fetch(TRC_BUNDLE_REDEEM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed, app_slug: APP_SLUG }),
    });
    const body = (await res.json().catch(() => null)) as
      | { valid: true; expiresAt: string }
      | { valid: false; reason: RedemptionResult extends { reason: infer R } ? R : never }
      | null;
    if (!body) return { success: false, reason: "network_error" };
    if (body.valid === true) {
      const expiresAt = new Date(body.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        return { success: false, reason: "network_error" };
      }
      await AsyncStorage.setItem(BUNDLE_EXPIRY_KEY, body.expiresAt);
      return { success: true, expiresAt };
    }
    return { success: false, reason: body.reason ?? "not_found" };
  } catch (err) {
    return { success: false, reason: "network_error" };
  }
}

export async function getBundleExpiry(): Promise<Date | null> {
  try {
    const raw = await AsyncStorage.getItem(BUNDLE_EXPIRY_KEY);
    if (!raw) return null;
    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function hasActiveBundle(): Promise<boolean> {
  const expiry = await getBundleExpiry();
  if (!expiry) return false;
  return expiry.getTime() > Date.now();
}

export async function clearBundleState(): Promise<void> {
  await AsyncStorage.removeItem(BUNDLE_EXPIRY_KEY);
}
