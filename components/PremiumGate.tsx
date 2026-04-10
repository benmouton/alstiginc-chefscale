import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from '@/constants/theme';
import { useSubscriptionStore, type PremiumFeature } from '@/store/useSubscriptionStore';

interface LockedCardProps {
  title: string;
  description: string;
  feature: PremiumFeature;
}

export function LockedCard({ title, description, feature }: LockedCardProps) {
  const getPaywallHeadline = useSubscriptionStore((s) => s.getPaywallHeadline);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/paywall', params: { feature, headline: getPaywallHeadline(feature) } });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.lockedCard, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.lockedOverlay}>
        <View style={styles.lockIconCircle}>
          <Ionicons name="lock-closed" size={24} color={Colors.primary} />
        </View>
        <Text style={styles.lockedTitle}>{title}</Text>
        <Text style={styles.lockedDescription}>{description}</Text>
        <View style={styles.unlockBtn}>
          <Ionicons name="star" size={14} color={Colors.primary} />
          <Text style={styles.unlockBtnText}>Unlock with Premium</Text>
        </View>
      </View>
    </Pressable>
  );
}

interface PremiumGateProps {
  feature: PremiumFeature;
  fallbackTitle: string;
  fallbackDescription: string;
  children: React.ReactNode;
}

export default function PremiumGate({ feature, fallbackTitle, fallbackDescription, children }: PremiumGateProps) {
  const checkAccess = useSubscriptionStore((s) => s.checkAccess);

  if (checkAccess(feature)) {
    return <>{children}</>;
  }

  return <LockedCard title={fallbackTitle} description={fallbackDescription} feature={feature} />;
}

interface ProBadgeProps {
  feature: PremiumFeature;
  size?: 'small' | 'medium';
}

export function ProBadge({ feature, size = 'small' }: ProBadgeProps) {
  const checkAccess = useSubscriptionStore((s) => s.checkAccess);

  if (checkAccess(feature)) return null;

  return (
    <View style={[styles.proBadge, size === 'medium' && styles.proBadgeMedium]}>
      <Text style={[styles.proBadgeText, size === 'medium' && styles.proBadgeTextMedium]}>PRO</Text>
    </View>
  );
}

interface LockOverlayButtonProps {
  feature: PremiumFeature;
  label: string;
  onPremiumPress: () => void;
  style?: any;
  icon?: string;
}

export function LockOverlayButton({ feature, label, onPremiumPress, style, icon }: LockOverlayButtonProps) {
  const checkAccess = useSubscriptionStore((s) => s.checkAccess);
  const getPaywallHeadline = useSubscriptionStore((s) => s.getPaywallHeadline);

  const handlePress = () => {
    if (checkAccess(feature)) {
      onPremiumPress();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: '/paywall', params: { feature, headline: getPaywallHeadline(feature) } });
    }
  };

  const isLocked = !checkAccess(feature);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.lockButton, style, pressed && { opacity: 0.7 }]}
    >
      {icon ? <Ionicons name={icon as any} size={20} color={isLocked ? Colors.textMuted : Colors.textPrimary} /> : null}
      <Text style={[styles.lockButtonText, isLocked && styles.lockButtonTextLocked]}>{label}</Text>
      {isLocked ? <Ionicons name="lock-closed" size={14} color={Colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lockedCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  lockedOverlay: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    opacity: 0.9,
  },
  lockIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  lockedTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'DMSans_700Bold',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  unlockBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'DMSans_600SemiBold',
  },
  proBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: Spacing.xs,
  },
  proBadgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'DMSans_700Bold',
  },
  proBadgeTextMedium: {
    fontSize: 11,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  lockButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'DMSans_600SemiBold',
  },
  lockButtonTextLocked: {
    color: Colors.textMuted,
  },
});
