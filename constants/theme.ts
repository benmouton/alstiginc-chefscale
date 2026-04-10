import { Platform } from "react-native";
export const MONO_FONT = Platform.OS === 'ios' ? 'SF Mono' : 'monospace';

export const Colors = {
  // Primary — orange accent (Brushed Steel)
  primary: '#f97316',        // vibrant orange
  primaryLight: '#fb923c',   // lighter orange
  primaryDark: '#ea580c',    // deep orange

  // Accent — herb/teal for secondary highlights
  accent: '#0D9488',         // teal (swapped from primary)
  accentLight: '#14B8A6',

  // Status
  error: '#EF4444',
  warning: '#f59e0b',
  success: '#22c55e',

  // Backgrounds — Brushed Steel blue-gray
  backgroundDark: '#2a2d32',     // base steel surface
  backgroundDeep: '#22252a',     // deep background
  backgroundCard: '#32363b',     // elevated card surface
  backgroundElevated: '#32363b', // higher elevation
  inputBackground: '#282b30',    // input field background

  // Glass effect base — replaced with solid steel tones
  glass: '#32363b',
  glassBorder: '#3a3d42',
  glassHighlight: '#32363b',

  // Text
  textPrimary: '#e8eaed',    // cool white
  textSecondary: '#8a8d92',  // steel gray
  textMuted: '#52525b',      // muted steel

  // Borders
  border: '#3a3d42',         // steel border
  borderLight: '#3a3d42',    // lighter border

  // Tab bar
  tabBar: '#2a2d32',
  tabBarBorder: '#32363b',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 34,
  hero: 42,
};

export const TouchTarget = {
  min: 48,
};
