import { Platform } from "react-native";
export const MONO_FONT = Platform.OS === 'ios' ? 'SF Mono' : 'monospace';

export const Colors = {
  // Primary — warm copper/saffron culinary accent
  primary: '#D97706',        // warm copper (was teal #0D9488)
  primaryLight: '#F59E0B',   // amber glow
  primaryDark: '#B45309',    // deep saffron

  // Accent — herb/teal for secondary highlights
  accent: '#0D9488',         // teal (swapped from primary)
  accentLight: '#14B8A6',

  // Status
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',

  // Backgrounds — dark charcoal, not pure black
  backgroundDark: '#0A0A0A',     // true rich black
  backgroundCard: '#141414',     // darker card
  backgroundElevated: '#1E1E1E', // higher elevation

  // Glass effect base
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHighlight: 'rgba(255,255,255,0.05)',

  // Text
  textPrimary: '#F5F5F4',    // warm white (was blue-white #F8FAFC)
  textSecondary: '#A8A29E',  // warm gray (was #94A3B8)
  textMuted: '#6B7280',      // muted (was #64748B)

  // Borders
  border: '#2A2D35',         // subtle (was #334155)
  borderLight: '#3A3D45',    // lighter

  // Tab bar
  tabBar: '#0A0A0A',
  tabBarBorder: '#141414',
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
