import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
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

const CATEGORY_GRADIENTS: Record<string, [string, string, string]> = {
  'Entrée': ['#D97706', '#92400E', '#0A0A0A'],
  'Appetizer': ['#DC2626', '#991B1B', '#0A0A0A'],
  'Sauce': ['#D97706', '#78350F', '#0A0A0A'],
  'Dessert': ['#DB2777', '#831843', '#0A0A0A'],
  'Prep': ['#0D9488', '#134E4A', '#0A0A0A'],
  'Side': ['#16A34A', '#14532D', '#0A0A0A'],
  'Beverage': ['#7C3AED', '#4C1D95', '#0A0A0A'],
};

const DEFAULT_GRADIENT: [string, string, string] = ['#D97706', '#B45309', '#0A0A0A'];

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
  const gradientColors = CATEGORY_GRADIENTS[recipe.category] || DEFAULT_GRADIENT;

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
      {/* Background: image or gradient */}
      {recipe.imageUri ? (
        <Image source={{ uri: recipe.imageUri }} style={styles.backgroundImage} />
      ) : (
        <LinearGradient
          colors={gradientColors}
          style={styles.fallbackGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <Ionicons name={iconName as any} size={64} color="rgba(255,255,255,0.2)" />
        </LinearGradient>
      )}

      {/* Dark overlay gradient at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,10,0.85)']}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        style={styles.overlay}
      />

      {/* Variation badge */}
      {recipe.parentRecipeId ? (
        <View style={styles.variationBadge}>
          <Ionicons name="git-branch-outline" size={12} color="#D97706" />
          <Text style={styles.variationBadgeText}>
            {recipe.variationLabel || 'Variation'}
          </Text>
        </View>
      ) : null}

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        <Text style={styles.name} numberOfLines={1}>
          {recipe.name}
        </Text>

        {recipe.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {recipe.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{recipe.baseServings} servings</Text>
          </View>
          {totalTime > 0 ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{totalTime}m</Text>
            </View>
          ) : null}
          <View style={styles.pill}>
            <Text style={styles.pillText}>{recipe.category}</Text>
          </View>
          {recipe.station ? (
            <View style={[styles.pill, styles.stationPill]}>
              <Text style={[styles.pillText, styles.stationPillText]}>
                {recipe.station}
              </Text>
            </View>
          ) : null}
        </View>

        {dietaryFlags.length > 0 ? (
          <View style={styles.dietaryRow}>
            {dietaryFlags.map((flag) => (
              <View
                key={flag}
                style={[
                  styles.dietaryDot,
                  {
                    backgroundColor:
                      DIETARY_COLORS[flag.toLowerCase()] || Colors.accent,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  fallbackGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F5F4',
    fontFamily: 'Inter_700Bold',
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_600SemiBold',
  },
  stationPill: {
    backgroundColor: 'rgba(217,119,6,0.25)',
  },
  stationPillText: {
    color: '#D97706',
  },
  dietaryRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  dietaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  variationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217,119,6,0.2)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  variationBadgeText: {
    fontSize: 10,
    color: '#D97706',
    fontFamily: 'Inter_600SemiBold',
  },
});
