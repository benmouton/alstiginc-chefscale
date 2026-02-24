import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from '@/constants/theme';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

interface ComparisonRow {
  label: string;
  free: string | boolean;
  premium: string | boolean;
}

const COMPARISON: ComparisonRow[] = [
  { label: 'Saved recipes', free: '10 recipes', premium: 'Unlimited' },
  { label: 'Scaling', free: 'x2, x5, x10', premium: 'Any number' },
  { label: 'Recipe entry', free: 'Manual only', premium: 'Manual + OCR scan' },
  { label: 'Cost calculator', free: false, premium: true },
  { label: 'Nutrition info', free: false, premium: true },
  { label: 'AI recipe validation', free: false, premium: true },
  { label: 'Allergen filtering', free: false, premium: true },
  { label: 'Cloud sync & backup', free: false, premium: true },
  { label: 'Export & import', free: false, premium: true },
  { label: 'Cook mode', free: false, premium: true },
  { label: 'Step-level photos', free: false, premium: true },
];

export default function PaywallScreen() {
  const { feature, headline } = useLocalSearchParams<{ feature?: string; headline?: string }>();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { startTrial, isTrialing, trialEndsAt, tier } = useSubscriptionStore();

  const displayHeadline = headline || 'Unlock the full kitchen toolkit';

  const handleMonthly = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Monthly Plan',
      'In-app purchases will be available once ChefScale is on the App Store. Start a free trial in the meantime!',
    );
  };

  const handleAnnual = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Annual Plan',
      'In-app purchases will be available once ChefScale is on the App Store. Start a free trial in the meantime!',
    );
  };

  const handleTrial = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startTrial();
    Alert.alert(
      'Trial Started!',
      'You now have 7 days of full Premium access. Enjoy all features!',
      [{ text: 'Let\'s go!', onPress: () => router.back() }],
    );
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Restore', 'Purchase restoration will be available once connected to the App Store.');
  };

  const handleConsultantVerify = () => {
    Linking.openURL('https://restaurantai.consulting/premium-verify');
  };

  const handleConsultantLearn = () => {
    Linking.openURL('https://restaurantai.consulting');
  };

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary + '30', Colors.backgroundDark]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: insets.top + webTopInset + 8 }]}
      >
        <Ionicons name="close" size={24} color={Colors.textSecondary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + webTopInset + 60, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant-outline" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>ChefScale</Text>
          <Text style={styles.premiumLabel}>PREMIUM</Text>
        </View>

        <Text style={styles.headline}>{displayHeadline}</Text>

        {isTrialing && trialDaysLeft > 0 ? (
          <View style={styles.trialBanner}>
            <Ionicons name="time-outline" size={16} color={Colors.accent} />
            <Text style={styles.trialBannerText}>Trial: {trialDaysLeft} day(s) remaining</Text>
          </View>
        ) : null}

        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <View style={styles.comparisonHeaderCol}>
              <Text style={styles.comparisonHeaderLabel}>FREE</Text>
            </View>
            <View style={styles.comparisonHeaderCol}>
              <Text style={[styles.comparisonHeaderLabel, { color: Colors.primary }]}>PREMIUM</Text>
            </View>
          </View>

          {COMPARISON.map((row, idx) => (
            <View
              key={row.label}
              style={[styles.comparisonRow, idx === COMPARISON.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Text style={styles.comparisonLabel}>{row.label}</Text>
              <View style={styles.comparisonValues}>
                <View style={styles.comparisonValueCol}>
                  {typeof row.free === 'string' ? (
                    <Text style={styles.comparisonValueText}>{row.free}</Text>
                  ) : row.free ? (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  ) : (
                    <Text style={styles.comparisonDash}>—</Text>
                  )}
                </View>
                <View style={styles.comparisonValueCol}>
                  {typeof row.premium === 'string' ? (
                    <Text style={[styles.comparisonValueText, { color: Colors.primary }]}>{row.premium}</Text>
                  ) : row.premium ? (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  ) : (
                    <Text style={styles.comparisonDash}>—</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricingSection}>
          <Pressable
            onPress={handleAnnual}
            style={({ pressed }) => [styles.annualBtn, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 33%</Text>
            </View>
            <Text style={styles.annualPrice}>$39.99 / year</Text>
            <Text style={styles.annualSubtext}>$3.33/mo — Best value</Text>
          </Pressable>

          <Pressable
            onPress={handleMonthly}
            style={({ pressed }) => [styles.monthlyBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.monthlyPrice}>$4.99 / month</Text>
          </Pressable>

          {!isTrialing && tier === 'free' ? (
            <Pressable onPress={handleTrial} style={styles.trialLink}>
              <Text style={styles.trialLinkText}>Start 7-day free trial</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={handleRestore} style={styles.restoreLink}>
            <Text style={styles.restoreLinkText}>Restore Purchase</Text>
          </Pressable>
        </View>

        <View style={styles.consultantSection}>
          <View style={styles.consultantDivider} />
          <View style={styles.consultantContent}>
            <View style={styles.consultantRow}>
              <Ionicons name="restaurant" size={18} color={Colors.primary} />
              <Text style={styles.consultantTitle}>Restaurant Consultant subscribers get Premium free</Text>
            </View>
            <Pressable onPress={handleConsultantVerify}>
              <Text style={styles.consultantLink}>Already a subscriber? Verify here</Text>
            </Pressable>
            <Pressable onPress={handleConsultantLearn}>
              <Text style={styles.consultantLink}>Learn about The Restaurant Consultant</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  premiumLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 3,
    marginTop: Spacing.xs,
  },
  headline: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 32,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent + '15',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  trialBannerText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontFamily: 'Inter_600SemiBold',
  },
  comparisonCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  comparisonHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'flex-end',
  },
  comparisonHeaderCol: {
    width: 80,
    alignItems: 'center',
  },
  comparisonHeaderLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  comparisonLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  comparisonValues: {
    flexDirection: 'row',
  },
  comparisonValueCol: {
    width: 80,
    alignItems: 'center',
  },
  comparisonValueText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  comparisonDash: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  pricingSection: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  annualBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    minHeight: TouchTarget.min + 12,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'Inter_700Bold',
  },
  annualPrice: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  annualSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary + 'CC',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  monthlyBtn: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  monthlyPrice: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  trialLink: {
    paddingVertical: Spacing.md,
  },
  trialLinkText: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
  restoreLink: {
    paddingVertical: Spacing.sm,
  },
  restoreLinkText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  consultantSection: {
    backgroundColor: Colors.backgroundCard + '80',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  consultantDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  consultantContent: {
    gap: Spacing.md,
  },
  consultantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  consultantTitle: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  consultantLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
    marginLeft: 26,
  },
});
