import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';
import { formatCurrency, type RecipeCostSummary } from '@/lib/costs';

interface CostSummaryProps {
  summary: RecipeCostSummary;
}

export default function CostSummary({ summary }: CostSummaryProps) {
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
});
