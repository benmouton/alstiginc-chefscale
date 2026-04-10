import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';
import type { AllergenInfo } from '@/constants/allergens';

interface AllergenBadgeProps {
  allergen: AllergenInfo;
  size?: 'small' | 'medium';
}

export default function AllergenBadge({ allergen, size = 'medium' }: AllergenBadgeProps) {
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { borderColor: allergen.color + '40' }]}>
      <Ionicons
        name={allergen.icon as any}
        size={isSmall ? 12 : 16}
        color={allergen.color}
      />
      <Text
        style={[
          styles.text,
          { color: allergen.color },
          isSmall && styles.textSmall,
        ]}
      >
        {allergen.name}
      </Text>
    </View>
  );
}

interface AllergenListProps {
  allergens: AllergenInfo[];
}

export function AllergenList({ allergens }: AllergenListProps) {
  if (allergens.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="warning-outline" size={18} color={Colors.warning} />
        <Text style={styles.title}>Contains:</Text>
      </View>
      <View style={styles.list}>
        {allergens.map((allergen) => (
          <AllergenBadge key={allergen.id} allergen={allergen} />
        ))}
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
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'DMSans_600SemiBold',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundDark,
    borderWidth: 1,
    gap: 6,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
  },
  textSmall: {
    fontSize: FontSize.xs,
  },
});
