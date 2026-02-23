import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { formatQuantity, getUnitAbbreviation } from '@/lib/scaling';

interface IngredientRowProps {
  name: string;
  quantity: number;
  unit: string;
  scaledQuantity?: number;
  cost?: number | null;
  isScaled?: boolean;
}

export default function IngredientRow({
  name,
  quantity,
  unit,
  scaledQuantity,
  cost,
  isScaled,
}: IngredientRowProps) {
  const displayQuantity = scaledQuantity ?? quantity;
  const unitAbbr = getUnitAbbreviation(unit);

  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.quantityContainer}>
        <Text style={[styles.quantity, isScaled && styles.quantityScaled]}>
          {formatQuantity(displayQuantity)}
        </Text>
        <Text style={styles.unit}>{unitAbbr}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      {cost !== undefined && cost !== null ? (
        <Text style={styles.cost}>${cost.toFixed(2)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: Spacing.md,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 72,
    marginRight: Spacing.sm,
  },
  quantity: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginRight: 4,
  },
  quantityScaled: {
    color: Colors.accent,
  },
  unit: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  name: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  cost: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: Spacing.sm,
  },
});
