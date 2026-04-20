import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const QUEUE_KEY = "@chefscale_cross_promo_events_v1";
const QUEUE_MAX = 500;

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) sessionId = Crypto.randomUUID();
  return sessionId;
}

export type CrossPromoEventName =
  | "cross_promo_banner_impression"
  | "cross_promo_banner_dismissed"
  | "cross_promo_banner_clicked";

export interface CrossPromoEventProps {
  source_app: string;
  target_app: string;
  trigger_event: string;
  placement: string;
  session_id: string;
}

let writeLock: Promise<void> = Promise.resolve();

export async function trackCrossPromoEvent(
  event: CrossPromoEventName,
  props: Omit<CrossPromoEventProps, "session_id">,
): Promise<void> {
  const entry = {
    event,
    props: { ...props, session_id: getSessionId() },
    ts: Date.now(),
  };
  const next = writeLock.then(async () => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? (JSON.parse(raw) as unknown[]) : [];
      queue.push(entry);
      const trimmed = queue.length > QUEUE_MAX ? queue.slice(-QUEUE_MAX) : queue;
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
    } catch {
      // Never block product flows on analytics.
    }
  });
  writeLock = next.catch(() => undefined);
  await next;
  if (__DEV__) console.log("[cross-promo]", event, props);
}

export async function peekCrossPromoQueue(): Promise<unknown[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as unknown[]) : [];
}

export async function clearCrossPromoQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
