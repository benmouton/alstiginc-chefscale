import type { Ionicons } from "@expo/vector-icons";

export type AppKey =
  | "mycookbook"
  | "chefscale"
  | "menucraft"
  | "restaurant-consultant"
  | "review-responder"
  | "vendorwatch";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export interface PromoVariant {
  placementKey: string;
  triggerEvent: string;
  headline: string;
  body: string;
  ctaLabel: string;
  icon: IconName;
  compact?: boolean;
}

export interface PromoEntry {
  sourceApp: AppKey;
  targetApp: AppKey;
  targetAppLabel: string;
  ctaUrl: string;
  variants: Record<string, PromoVariant>;
}

export const APP_STORE_URLS: Record<AppKey, string> = {
  mycookbook: "https://apps.apple.com/app/mycookbook/id6743274077",
  chefscale: "https://apps.apple.com/app/chefscale/id6759728525",
  menucraft: "https://apps.apple.com/app/menucraft/id6761072521",
  "restaurant-consultant": "https://apps.apple.com/app/the-restaurant-consultant/id6759510319",
  "review-responder": "https://apps.apple.com/app/review-responder/id6759874324",
  vendorwatch: "https://apps.apple.com/app/vendorwatch/id6760472888",
};

export const PROMO_REGISTRY: PromoEntry[] = [
  {
    sourceApp: "chefscale",
    targetApp: "mycookbook",
    targetAppLabel: "MyCookbook",
    ctaUrl: APP_STORE_URLS.mycookbook,
    variants: {
      "post-scale": {
        placementKey: "post-scale",
        triggerEvent: "recipe_scaled",
        headline: "Save this in MyCookbook",
        body: "Keep scaled recipes organized and ready for your next prep run.",
        ctaLabel: "Get MyCookbook",
        icon: "book-outline",
      },
      "settings-discovery": {
        placementKey: "settings-discovery",
        triggerEvent: "settings_view_landed",
        headline: "Also by ALSTIG",
        body: "MyCookbook — your personal digital cookbook. Organize, collect, and cook from your recipe collection.",
        ctaLabel: "Get MyCookbook",
        icon: "book-outline",
      },
      "home-organize": {
        placementKey: "home-organize",
        triggerEvent: "home_recipe_list_viewed",
        headline: "Organize Your Collection",
        body: "MyCookbook lets you build a personal digital cookbook — organize by station or category, with a beautiful card-based layout.",
        ctaLabel: "Get MyCookbook",
        icon: "book-outline",
      },
      "cooking-mode": {
        placementKey: "cooking-mode",
        triggerEvent: "recipe_detail_opened",
        headline: "Hands-Free Cooking Mode",
        body: "MyCookbook has a dedicated cooking mode with step-by-step navigation, keep-awake, and ingredient check-off.",
        ctaLabel: "Get MyCookbook",
        icon: "flame-outline",
        compact: true,
      },
    },
  },
];

export function getPromoEntry(sourceApp: AppKey, targetApp: AppKey): PromoEntry | undefined {
  return PROMO_REGISTRY.find((e) => e.sourceApp === sourceApp && e.targetApp === targetApp);
}

export function getPromoVariant(
  sourceApp: AppKey,
  targetApp: AppKey,
  placementKey: string,
): PromoVariant | undefined {
  return getPromoEntry(sourceApp, targetApp)?.variants[placementKey];
}
