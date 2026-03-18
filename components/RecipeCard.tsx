import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';
import type { RecipeRow } from '@/lib/database';

interface RecipeCardProps {
  recipe: RecipeRow;
  onPress: () => void;
  onLongPress?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Entrée': 'restaurant-outline',
  'Appetizer': 'fast-food-outline',
  'Sauce': 'flask-outline',
  'Dessert': 'ice-cream-outline',
  'Prep': 'cut-outline',
  'Side': 'layers-outline',
  'Beverage': 'wine-outline',
};

const DIETARY_COLORS: Record<string, string> = {
  'vegan': '#22C55E',
  'vegetarian': '#4ADE80',
  'gluten-free': '#F59E0B',
  'dairy-free': '#3B82F6',
  'nut-free': '#EF4444',
  'halal': '#8B5CF6',
  'kosher': '#06B6D4',
};

export default function RecipeCard({ recipe, onPress, onLongPress }: RecipeCardProps) {
  const iconName = CATEGORY_ICONS[recipe.category] || 'grid-outline';
  const totalTime = recipe.prepTime + recipe.cookTime;
  const dietaryFlags = recipe.dietaryFlags
    ? recipe.dietaryFlags.split(',').map((f) => f.trim()).filter(Boolean)
    : [];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      testID={`recipe-card-${recipe.id}`}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName as any} size={28} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{recipe.name}</Text>
        {recipe.description ? (
          <Text style={styles.description} numberOfLines={2}>{recipe.description}</Text>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{recipe.baseServings}</Text>
          </View>
          {totalTime > 0 ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{totalTime}m</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="layers-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{recipe.category}</Text>
          </View>
        </View>
        {recipe.station ? (
          <View style={styles.stationBadge}>
            <Text style={styles.stationText}>{recipe.station}</Text>
          </View>
        ) : null}
        {dietaryFlags.length > 0 ? (
          <View style={styles.dietaryRow}>
            {dietaryFlags.map((flag) => (
              <View
                key={flag}
                style={[
                  styles.dietaryDot,
                  { backgroundColor: DIETARY_COLORS[flag.toLowerCase()] || Colors.accent },
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  meta: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  stationBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '20',
  },
  stationText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  dietaryRow: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
    gap: 6,
  },
  dietaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
