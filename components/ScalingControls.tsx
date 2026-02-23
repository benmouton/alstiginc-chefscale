import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Spacing, FontSize, TouchTarget } from '@/constants/theme';

interface ScalingControlsProps {
  originalServings: number;
  currentServings: number;
  onServingsChange: (servings: number) => void;
}

const PRESET_MULTIPLIERS = [0.5, 1, 1.5, 2, 3, 4];

export default function ScalingControls({
  originalServings,
  currentServings,
  onServingsChange,
}: ScalingControlsProps) {
  const scaleFactor = originalServings > 0 ? currentServings / originalServings : 1;

  const handleDecrement = () => {
    if (currentServings > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onServingsChange(currentServings - 1);
    }
  };

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onServingsChange(currentServings + 1);
  };

  const handlePreset = (multiplier: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onServingsChange(Math.max(1, Math.round(originalServings * multiplier)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Servings</Text>
        <Text style={styles.factor}>{scaleFactor.toFixed(1)}x</Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={handleDecrement}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            currentServings <= 1 && styles.buttonDisabled,
          ]}
          disabled={currentServings <= 1}
        >
          <Ionicons
            name="remove"
            size={24}
            color={currentServings <= 1 ? Colors.textMuted : Colors.textPrimary}
          />
        </Pressable>

        <View style={styles.valueContainer}>
          <Text style={styles.value}>{currentServings}</Text>
        </View>

        <Pressable
          onPress={handleIncrement}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.presets}>
        {PRESET_MULTIPLIERS.map((mult) => {
          const target = Math.max(1, Math.round(originalServings * mult));
          const isActive = currentServings === target;
          return (
            <Pressable
              key={mult}
              onPress={() => handlePreset(mult)}
              style={[styles.preset, isActive && styles.presetActive]}
            >
              <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                {mult}x
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  factor: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  button: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  valueContainer: {
    minWidth: 60,
    alignItems: 'center',
  },
  value: {
    fontSize: FontSize.display,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  presets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  preset: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
  },
  presetActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  presetTextActive: {
    color: Colors.textPrimary,
  },
});
