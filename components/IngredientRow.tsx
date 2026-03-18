import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { formatQuantity, getUnitAbbreviation, type ScaleResult } from '@/lib/scaling';

interface IngredientRowProps {
  name: string;
  scaleResult: ScaleResult;
  prepNote?: string;
  isScalable?: boolean;
  cost?: number | null;
  isScaled?: boolean;
  yieldPercent?: number;
  subrecipeName?: string;
  onSubrecipePress?: () => void;
}

export default function IngredientRow({
  name,
  scaleResult,
  prepNote,
  isScalable = true,
  cost,
  isScaled,
  yieldPercent,
  subrecipeName,
  onSubrecipePress,
}: IngredientRowProps) {
  const hasYieldLoss = yieldPercent != null && yieldPercent < 100 && yieldPercent > 0;
  const asPurchased = hasYieldLoss
    ? scaleResult.amount / (yieldPercent! / 100)
    : null;

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
        {hasYieldLoss && asPurchased ? (
          <Text style={styles.asPurchased}>
            Buy {formatQuantity(asPurchased)} {getUnitAbbreviation(scaleResult.unit)} ({yieldPercent}% yield)
          </Text>
        ) : null}
        <View style={styles.nameRow}>
          {subrecipeName ? (
            <Pressable onPress={onSubrecipePress} style={styles.subrecipeLink}>
              <Ionicons name="link-outline" size={13} color={Colors.primary} />
              <Text style={[styles.name, { color: Colors.primary }]}>{name}</Text>
            </Pressable>
          ) : (
            <Text style={styles.name}>{name}</Text>
          )}
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
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
  asPurchased: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginTop: 1,
  },
  subrecipeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
