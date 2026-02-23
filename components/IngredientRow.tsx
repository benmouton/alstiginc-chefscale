import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { ScaleResult } from '@/lib/scaling';

interface IngredientRowProps {
  name: string;
  scaleResult: ScaleResult;
  prepNote?: string;
  isScalable?: boolean;
  cost?: number | null;
  isScaled?: boolean;
}

export default function IngredientRow({
  name,
  scaleResult,
  prepNote,
  isScalable = true,
  cost,
  isScaled,
}: IngredientRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, isScaled && isScalable && styles.amountScaled]}>
            {scaleResult.display}
          </Text>
          {isScaled && isScalable && scaleResult.originalDisplay ? (
            <Text style={styles.originalAmount}>({scaleResult.originalDisplay})</Text>
          ) : null}
          {!isScalable ? (
            <View style={styles.fixedBadge}>
              <Text style={styles.fixedBadgeText}>fixed</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          {prepNote ? <Text style={styles.prepNote}>{prepNote}</Text> : null}
        </View>
      </View>
      {cost !== undefined && cost !== null ? (
        <Text style={styles.cost}>${cost.toFixed(2)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  left: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  amount: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  amountScaled: {
    color: Colors.accent,
  },
  originalAmount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  fixedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundElevated,
  },
  fixedBadgeText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  name: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  prepNote: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  cost: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
});
