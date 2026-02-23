import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';
import { formatCurrency, type RecipeCostSummary } from '@/lib/costs';

interface CostSummaryProps {
  summary: RecipeCostSummary;
  menuPrice?: number;
}

function getFoodCostColor(percentage: number): string {
  if (percentage < 25) return '#22C55E';
  if (percentage <= 30) return Colors.accent;
  return Colors.error;
}

function getFoodCostLabel(percentage: number): string {
  if (percentage < 25) return 'Excellent';
  if (percentage <= 30) return 'Acceptable';
  return 'High';
}

export default function CostSummary({ summary, menuPrice }: CostSummaryProps) {
  const foodCostPct = menuPrice && menuPrice > 0
    ? Math.round((summary.costPerServing / menuPrice) * 100)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="card-outline" size={20} color={Colors.accent} />
        <Text style={styles.title}>Cost Estimate</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Total Cost</Text>
        <Text style={styles.value}>{formatCurrency(summary.totalCost)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Per Serving</Text>
        <Text style={styles.valueAccent}>{formatCurrency(summary.costPerServing)}</Text>
      </View>

      {foodCostPct !== null ? (
        <View style={styles.foodCostRow}>
          <Text style={styles.label}>Food Cost %</Text>
          <View style={styles.foodCostRight}>
            <View style={[styles.foodCostBadge, { backgroundColor: getFoodCostColor(foodCostPct) + '20' }]}>
              <Text style={[styles.foodCostPct, { color: getFoodCostColor(foodCostPct) }]}>
                {foodCostPct}%
              </Text>
              <Text style={[styles.foodCostLabel, { color: getFoodCostColor(foodCostPct) }]}>
                {getFoodCostLabel(foodCostPct)}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {summary.coverage < 100 ? (
        <View style={styles.coverageRow}>
          <View style={styles.coverageBar}>
            <View
              style={[styles.coverageFill, { width: `${summary.coverage}%` }]}
            />
          </View>
          <Text style={styles.coverageText}>{summary.coverage}% priced</Text>
        </View>
      ) : null}

      {summary.missingPrices.length > 0 ? (
        <View style={styles.missingContainer}>
          <Text style={styles.missingLabel}>
            Missing prices: {summary.missingPrices.join(', ')}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push('/(tabs)/prices')}
        style={({ pressed }) => [styles.editPricesLink, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
        <Text style={styles.editPricesText}>Edit Prices</Text>
      </Pressable>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  valueAccent: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.accent,
    fontFamily: 'Inter_700Bold',
  },
  foodCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  foodCostRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  foodCostPct: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  foodCostLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  coverageBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.backgroundElevated,
  },
  coverageFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  coverageText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  missingContainer: {
    marginTop: Spacing.sm,
  },
  missingLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
  },
  editPricesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  editPricesText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
