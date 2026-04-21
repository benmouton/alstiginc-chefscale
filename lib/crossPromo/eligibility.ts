import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppKey } from "./registry";

const DAY_MS = 24 * 60 * 60 * 1000;
export const DISMISS_PERSISTENCE_MS = 14 * DAY_MS;
export const FREQUENCY_CAP_MS = 1 * DAY_MS;

const dismissKey = (source: AppKey, target: AppKey) =>
  `@chefscale_cross_promo_dismissed_v2:${source}:${target}`;
const lastShownKey = (source: AppKey) => `@chefscale_cross_promo_last_shown_v2:${source}`;

const shownThisSession = new Set<string>();
const pairKey = (source: AppKey, target: AppKey) => `${source}:${target}`;

async function getTimestamp(key: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export async function isDismissed(source: AppKey, target: AppKey, now: number = Date.now()): Promise<boolean> {
  const dismissedAt = await getTimestamp(dismissKey(source, target));
  if (!dismissedAt) return false;
  return now - dismissedAt < DISMISS_PERSISTENCE_MS;
}

export async function isFrequencyCapped(source: AppKey, now: number = Date.now()): Promise<boolean> {
  const lastShown = await getTimestamp(lastShownKey(source));
  if (!lastShown) return false;
  return now - lastShown < FREQUENCY_CAP_MS;
}

export function tryClaimSessionSlot(source: AppKey, target: AppKey): boolean {
  const key = pairKey(source, target);
  if (shownThisSession.has(key)) return false;
  shownThisSession.add(key);
  return true;
}

export function unmarkShownThisSession(source: AppKey, target: AppKey): void {
  shownThisSession.delete(pairKey(source, target));
}

export async function markDismissed(source: AppKey, target: AppKey, now: number = Date.now()): Promise<void> {
  try {
    await AsyncStorage.setItem(dismissKey(source, target), String(now));
  } catch {
    // Non-fatal.
  }
}

export async function markShown(source: AppKey, now: number = Date.now()): Promise<void> {
  try {
    await AsyncStorage.setItem(lastShownKey(source), String(now));
  } catch {
    // Non-fatal.
  }
}

export async function resetEligibilityForTesting(source: AppKey, target: AppKey): Promise<void> {
  shownThisSession.delete(pairKey(source, target));
  await AsyncStorage.multiRemove([dismissKey(source, target), lastShownKey(source)]);
}
