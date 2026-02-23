import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';

export interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

interface NutritionCardProps {
  nutrition: NutritionData;
  servings: number;
}

interface NutrientRowProps {
  label: string;
  value: number | undefined;
  unit: string;
  color: string;
}

function NutrientRow({ label, value, unit, color }: NutrientRowProps) {
  if (value === undefined) return null;
  return (
    <View style={styles.nutrientRow}>
      <View style={[styles.nutrientDot, { backgroundColor: color }]} />
      <Text style={styles.nutrientLabel}>{label}</Text>
      <Text style={styles.nutrientValue}>
        {value}{unit}
      </Text>
    </View>
  );
}

export default function NutritionCard({ nutrition, servings }: NutritionCardProps) {
  const hasData = Object.values(nutrition).some((v) => v !== undefined);
  if (!hasData) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="fitness-outline" size={20} color={Colors.success} />
        <Text style={styles.title}>Nutrition per serving</Text>
      </View>

      <NutrientRow label="Calories" value={nutrition.calories} unit="kcal" color="#EF4444" />
      <NutrientRow label="Protein" value={nutrition.protein} unit="g" color="#3B82F6" />
      <NutrientRow label="Carbs" value={nutrition.carbs} unit="g" color="#F59E0B" />
      <NutrientRow label="Fat" value={nutrition.fat} unit="g" color="#EF4444" />
      <NutrientRow label="Fiber" value={nutrition.fiber} unit="g" color="#22C55E" />
      <NutrientRow label="Sugar" value={nutrition.sugar} unit="g" color="#EC4899" />
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
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  nutrientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  nutrientLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  nutrientValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
});
