import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppearanceMode = 'dark' | 'light' | 'system';
export type UnitSystem = 'us' | 'metric';

const STORAGE_KEY = 'chefscale_settings';

interface SettingsState {
  appearance: AppearanceMode;
  unitSystem: UnitSystem;
  defaultServings: number;
  _hydrated: boolean;

  setAppearance: (mode: AppearanceMode) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setDefaultServings: (servings: number) => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  appearance: 'dark',
  unitSystem: 'us',
  defaultServings: 4,
  _hydrated: false,

  setAppearance: (mode: AppearanceMode) => {
    set({ appearance: mode });
    get().persist();
  },

  setUnitSystem: (system: UnitSystem) => {
    set({ unitSystem: system });
    get().persist();
  },

  setDefaultServings: (servings: number) => {
    set({ defaultServings: servings });
    get().persist();
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          appearance: data.appearance || 'dark',
          unitSystem: data.unitSystem || 'us',
          defaultServings: data.defaultServings || 4,
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
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
          appearance: s.appearance,
          unitSystem: s.unitSystem,
          defaultServings: s.defaultServings,
        })
      );
    } catch {}
  },
}));
