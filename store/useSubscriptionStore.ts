import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkPremiumStatus, isRevenueCatReady } from '@/lib/revenueCat';

export type SubscriptionTier = 'free' | 'premium';

export type PremiumFeature =
  | 'unlimited_recipes'
  | 'custom_scaling'
  | 'cost_calculator'
  | 'nutrition'
  | 'ocr_scan'
  | 'recipe_validation'
  | 'allergen_filter'
  | 'cloud_sync'
  | 'export'
  | 'import'
  | 'step_photos'
  | 'cook_mode';

const FEATURE_HEADLINES: Record<PremiumFeature, string> = {
  unlimited_recipes: "You've hit 10 recipes — unlock unlimited",
  custom_scaling: 'Scale to any number — not just presets',
  cost_calculator: 'Know your exact food cost per plate',
  nutrition: 'Instant nutrition facts for every recipe',
  ocr_scan: 'Scan recipes in seconds — no typing',
  recipe_validation: 'AI checks your recipes for completeness',
  allergen_filter: 'Filter recipes by allergen-free',
  cloud_sync: 'Sync your recipes across all devices',
  export: 'Export your recipes to share or backup',
  import: 'Import recipes from files',
  step_photos: 'Add photos to each instruction step',
  cook_mode: 'Hands-free cooking mode for the line',
};

const STORAGE_KEY = 'chefscale_subscription';
const DISMISSAL_KEY = 'chefscale_promo_dismissals';

interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  trialEndsAt: string | null;
  isTrialing: boolean;
  recipeCount: number;
  maxFreeRecipes: number;
  promoDismissals: number;
  saveCount: number;
  _hydrated: boolean;

  checkAccess: (feature: PremiumFeature) => boolean;
  getPaywallHeadline: (feature: PremiumFeature) => string;
  setPremium: (expiresAt: string) => void;
  setFree: () => void;
  startTrial: () => void;
  setRecipeCount: (count: number) => void;
  incrementRecipeCount: () => void;
  decrementRecipeCount: () => void;
  incrementSaveCount: () => void;
  incrementPromoDismissals: () => void;
  shouldShowPromo: () => boolean;
  syncWithRevenueCat: () => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',
  expiresAt: null,
  trialEndsAt: null,
  isTrialing: false,
  recipeCount: 0,
  maxFreeRecipes: 10,
  promoDismissals: 0,
  saveCount: 0,
  _hydrated: false,

  checkAccess: (feature: PremiumFeature) => {
    const state = get();
    if (state.tier === 'premium') return true;

    if (feature === 'unlimited_recipes') {
      return state.recipeCount < state.maxFreeRecipes;
    }

    return false;
  },

  getPaywallHeadline: (feature: PremiumFeature) => {
    return FEATURE_HEADLINES[feature] || 'Unlock the full kitchen toolkit';
  },

  setPremium: (expiresAt: string) => {
    set({ tier: 'premium', expiresAt, isTrialing: false });
    get().persist();
  },

  setFree: () => {
    set({ tier: 'free', expiresAt: null, isTrialing: false, trialEndsAt: null });
    get().persist();
  },

  startTrial: () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    set({
      tier: 'premium',
      isTrialing: true,
      trialEndsAt: trialEnd.toISOString(),
      expiresAt: trialEnd.toISOString(),
    });
    get().persist();
  },

  setRecipeCount: (count: number) => {
    set({ recipeCount: count });
  },

  incrementRecipeCount: () => {
    set((s) => ({ recipeCount: s.recipeCount + 1 }));
  },

  decrementRecipeCount: () => {
    set((s) => ({ recipeCount: Math.max(0, s.recipeCount - 1) }));
  },

  incrementSaveCount: () => {
    set((s) => ({ saveCount: s.saveCount + 1 }));
  },

  incrementPromoDismissals: () => {
    const next = get().promoDismissals + 1;
    set({ promoDismissals: next });
    AsyncStorage.setItem(DISMISSAL_KEY, String(next)).catch(() => {});
  },

  shouldShowPromo: () => {
    const s = get();
    if (s.tier === 'premium') return false;
    if (s.promoDismissals >= 3) return false;
    return s.saveCount > 0 && s.saveCount % 5 === 0;
  },

  syncWithRevenueCat: async () => {
    if (!isRevenueCatReady()) return;
    try {
      const isPremium = await checkPremiumStatus();
      if (isPremium) {
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 1);
        set({ tier: 'premium', expiresAt: farFuture.toISOString(), isTrialing: false });
        get().persist();
      } else {
        const state = get();
        if (!state.isTrialing) {
          set({ tier: 'free', expiresAt: null });
          get().persist();
        }
      }
    } catch (e) {
      console.error('RevenueCat sync error:', e);
    }
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.tier === 'premium' && data.expiresAt) {
          if (new Date(data.expiresAt) < new Date()) {
            set({ tier: 'free', expiresAt: null, isTrialing: false, trialEndsAt: null, _hydrated: true });
            return;
          }
        }
        set({
          tier: data.tier || 'free',
          expiresAt: data.expiresAt || null,
          trialEndsAt: data.trialEndsAt || null,
          isTrialing: data.isTrialing || false,
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
      const dismissRaw = await AsyncStorage.getItem(DISMISSAL_KEY);
      if (dismissRaw) set({ promoDismissals: parseInt(dismissRaw) || 0 });
    } catch {
      set({ _hydrated: true });
    }
  },

  persist: async () => {
    try {
      const s = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tier: s.tier,
          expiresAt: s.expiresAt,
          trialEndsAt: s.trialEndsAt,
          isTrialing: s.isTrialing,
        })
      );
    } catch {}
  },
}));
