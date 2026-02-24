import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Spacing, FontSize, TouchTarget } from '@/constants/theme';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

interface ScalingControlsProps {
  originalServings: number;
  currentServings: number;
  onServingsChange: (servings: number) => void;
  yieldUnit?: string;
}

const FREE_MULTIPLIERS = [1, 2, 5, 10];
const PREMIUM_MULTIPLIERS = [25];

export default function ScalingControls({
  originalServings,
  currentServings,
  onServingsChange,
  yieldUnit = 'servings',
}: ScalingControlsProps) {
  const [customInput, setCustomInput] = useState('');
  const checkAccess = useSubscriptionStore((s) => s.checkAccess);
  const getPaywallHeadline = useSubscriptionStore((s) => s.getPaywallHeadline);
  const hasPremiumScaling = checkAccess('custom_scaling');
  const scaleFactor = originalServings > 0 ? currentServings / originalServings : 1;
  const isScaled = currentServings !== originalServings;

  const handleQuickScale = (multiplier: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onServingsChange(Math.max(1, Math.round(originalServings * multiplier)));
  };

  const handlePremiumGate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/paywall', params: { feature: 'custom_scaling', headline: getPaywallHeadline('custom_scaling') } });
  };

  const handleCustomScale = () => {
    if (!hasPremiumScaling) {
      handlePremiumGate();
      return;
    }
    const val = parseInt(customInput);
    if (val > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onServingsChange(val);
      setCustomInput('');
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onServingsChange(originalServings);
    setCustomInput('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>SCALE THIS RECIPE</Text>
        {isScaled ? (
          <Pressable onPress={handleReset} hitSlop={8}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.scaleDisplay}>
        <Text style={styles.scaleMultiplier}>×{scaleFactor % 1 === 0 ? scaleFactor : scaleFactor.toFixed(1)}</Text>
        <Text style={styles.servingsText}>
          Making {currentServings} {yieldUnit}
        </Text>
      </View>

      <View style={styles.quickButtons}>
        {FREE_MULTIPLIERS.map((mult) => {
          const target = Math.max(1, Math.round(originalServings * mult));
          const isActive = currentServings === target;
          return (
            <Pressable
              key={mult}
              onPress={() => handleQuickScale(mult)}
              style={({ pressed }) => [
                styles.quickBtn,
                isActive && styles.quickBtnActive,
                pressed && { opacity: 0.7 },
              ]}
              testID={`scale-${mult}x`}
            >
              <Text style={[styles.quickBtnText, isActive && styles.quickBtnTextActive]}>
                ×{mult}
              </Text>
            </Pressable>
          );
        })}
        {PREMIUM_MULTIPLIERS.map((mult) => {
          const target = Math.max(1, Math.round(originalServings * mult));
          const isActive = currentServings === target;
          return (
            <Pressable
              key={mult}
              onPress={() => hasPremiumScaling ? handleQuickScale(mult) : handlePremiumGate()}
              style={({ pressed }) => [
                styles.quickBtn,
                isActive && styles.quickBtnActive,
                !hasPremiumScaling && styles.quickBtnLocked,
                pressed && { opacity: 0.7 },
              ]}
              testID={`scale-${mult}x`}
            >
              <Text style={[styles.quickBtnText, isActive && styles.quickBtnTextActive, !hasPremiumScaling && styles.quickBtnTextLocked]}>
                ×{mult}
              </Text>
              {!hasPremiumScaling ? <Ionicons name="lock-closed" size={10} color={Colors.textMuted} style={{ marginLeft: 2 }} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.customRow}>
        <Pressable
          onPress={!hasPremiumScaling ? handlePremiumGate : undefined}
          style={{ flex: 1 }}
          disabled={hasPremiumScaling}
        >
          <TextInput
            style={[styles.customInput, !hasPremiumScaling && styles.customInputLocked]}
            value={customInput}
            onChangeText={hasPremiumScaling ? setCustomInput : undefined}
            placeholder={hasPremiumScaling ? `Custom ${yieldUnit}` : `Custom ${yieldUnit} (Premium)`}
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            returnKeyType="go"
            onSubmitEditing={handleCustomScale}
            editable={hasPremiumScaling}
            testID="custom-servings-input"
          />
        </Pressable>
        <Pressable
          onPress={handleCustomScale}
          style={({ pressed }) => [
            styles.scaleBtn,
            pressed && { opacity: 0.7 },
            (!customInput && hasPremiumScaling) && styles.scaleBtnDisabled,
          ]}
          disabled={!customInput && hasPremiumScaling}
          testID="custom-scale-btn"
        >
          {!hasPremiumScaling ? (
            <Ionicons name="lock-closed" size={16} color={Colors.textPrimary} />
          ) : (
            <Text style={styles.scaleBtnText}>Scale</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  resetText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
  scaleDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scaleMultiplier: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  servingsText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: Spacing.xs,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
  },
  quickBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: 'Inter_700Bold',
  },
  quickBtnTextActive: {
    color: Colors.textPrimary,
  },
  quickBtnLocked: {
    borderColor: Colors.border + '60',
    flexDirection: 'row',
    gap: 2,
  },
  quickBtnTextLocked: {
    color: Colors.textMuted,
  },
  customRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchTarget.min,
  },
  customInputLocked: {
    opacity: 0.5,
  },
  scaleBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: TouchTarget.min,
  },
  scaleBtnDisabled: {
    opacity: 0.4,
  },
  scaleBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
});
