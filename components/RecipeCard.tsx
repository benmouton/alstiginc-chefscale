import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, MONO_FONT } from '@/constants/theme';
import type { RecipeRow } from '@/lib/database';

interface RecipeCardProps {
  recipe: RecipeRow;
  onPress: () => void;
  onLongPress?: () => void;
}

const CATEGORY_ACCENT: Record<string, string> = {
  'Entrée': '#f97316',
  'Appetizer': '#ef4444',
  'Sauce': '#f97316',
  'Dessert': '#ec4899',
  'Prep': '#0d9488',
  'Side': '#22c55e',
  'Beverage': '#7c3aed',
};

const DEFAULT_ACCENT = '#f97316';

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const accentColor = CATEGORY_ACCENT[recipe.category] || DEFAULT_ACCENT;
  const iconName = CATEGORY_ICONS[recipe.category] || 'grid-outline';
  const totalTime = recipe.prepTime + recipe.cookTime;

  let dietaryFlags: string[] = [];
  if (recipe.dietaryFlags) {
    try {
      const parsed = JSON.parse(recipe.dietaryFlags);
      if (Array.isArray(parsed)) {
        dietaryFlags = parsed.filter(Boolean);
      }
    } catch {
      dietaryFlags = recipe.dietaryFlags
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
    }
  }

  // Cost data is not stored on RecipeRow directly — omit per-card cost display
  const foodCostDisplay: string | null = null;

  return (
    <Animated.View style={[animatedStyle]} testID={`recipe-card-${recipe.id}`}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Left accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />

        {/* Main content */}
        <View style={styles.body}>
          {/* Name row */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {recipe.name}
            </Text>
            {foodCostDisplay ? (
              <Text style={styles.foodCost}>{foodCostDisplay}</Text>
            ) : null}
          </View>

          {/* Description */}
          {recipe.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {recipe.description}
            </Text>
          ) : null}

          {/* Metadata row */}
          <View style={styles.metaRow}>
            {/* Category badge */}
            <View style={[styles.categoryBadge, { borderColor: accentColor + '60' }]}>
              <Ionicons name={iconName as any} size={11} color={accentColor} />
              <Text style={[styles.categoryText, { color: accentColor }]}>
                {recipe.category}
              </Text>
            </View>

            <View style={styles.metaPill}>
              <Ionicons name="people-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>{recipe.baseServings}</Text>
            </View>

            {totalTime > 0 ? (
              <View style={styles.metaPill}>
                <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.metaText}>{totalTime}m</Text>
              </View>
            ) : null}

            {recipe.station ? (
              <View style={[styles.metaPill, styles.stationPill]}>
                <Text style={[styles.metaText, styles.stationText]}>{recipe.station}</Text>
              </View>
            ) : null}
          </View>

          {/* Allergen dots + variation badge */}
          {(dietaryFlags.length > 0 || recipe.parentRecipeId) ? (
            <View style={styles.bottomRow}>
              {dietaryFlags.length > 0 ? (
                <View style={styles.allergenRow}>
                  {dietaryFlags.map((flag) => (
                    <View
                      key={flag}
                      style={[
                        styles.allergenDot,
                        { backgroundColor: DIETARY_COLORS[flag.toLowerCase()] || Colors.accent },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
              {recipe.parentRecipeId ? (
                <View style={styles.variationBadge}>
                  <Ionicons name="git-branch-outline" size={11} color={Colors.primary} />
                  <Text style={styles.variationText}>
                    {recipe.variationLabel || 'Variation'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.chevron} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  accentStripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.textPrimary,
  },
  foodCost: {
    fontSize: 13,
    fontFamily: MONO_FONT,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  description: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: Colors.backgroundDeep,
  },
  metaText: {
    fontSize: 11,
    fontFamily: MONO_FONT,
    color: Colors.textMuted,
  },
  stationPill: {
    backgroundColor: Colors.primary + '20',
  },
  stationText: {
    color: Colors.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  allergenRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  allergenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  variationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: Colors.primary + '15',
  },
  variationText: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.primary,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: 10,
    marginLeft: 4,
  },
});
