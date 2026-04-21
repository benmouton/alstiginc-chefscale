import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Platform,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius, MONO_FONT } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import type { RecipeRow } from "@/lib/database";
import RecipeCard from "@/components/RecipeCard";
import { CrossPromoCard } from "@/components/CrossPromoCard";
import { STATIONS } from "@/constants/stations";

const CATEGORIES = ["All", "Entr\u00e9e", "Appetizer", "Sauce", "Dessert", "Prep", "Side", "Beverage"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, loadRecipes, removeRecipe, prices, loadPrices } = useRecipeStore();
  const { tier, maxFreeRecipes, setRecipeCount } = useSubscriptionStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStation, setSelectedStation] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecipes();
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRecipeCount(recipes.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  }, [loadRecipes]);

  // Stats dashboard — computed from recipes that have price-bearing ingredients
  const stats = useMemo(() => {
    // We only have RecipeRow here (no ingredient detail), so we use prices count
    // as a proxy for whether cost data is available
    const hasPrices = prices.length > 0;
    if (!hasPrices || recipes.length === 0) return null;

    // Build a simple average from any recipes with calculable costs
    // using ingredient-level costPerUnit stored on RecipeRow's ingredients
    // Since we don't have full ingredient detail here, show price library stats
    const avgCostPerServing = prices.length > 0
      ? prices.reduce((sum, p) => sum + (p.costPerUnit ?? 0), 0) / prices.length
      : 0;

    return {
      recipeCount: recipes.length,
      priceCount: prices.length,
      avgCostPerServing,
    };
  }, [recipes, prices]);

  const filteredRecipes = recipes.filter((r) => {
    if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
    if (selectedStation !== "All" && r.station !== selectedStation) return false;
    return true;
  });

  const handleDeleteRecipe = (recipe: RecipeRow) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to delete "${recipe.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeRecipe(recipe.id);
            useSubscriptionStore.getState().decrementRecipeCount();
          },
        },
      ]
    );
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ChefScale</Text>
          <Text style={styles.subtitle}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            {tier === 'free' ? ` / ${maxFreeRecipes} free` : ''}
          </Text>
        </View>
        <View style={styles.headerBtns}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (useSubscriptionStore.getState().checkAccess('prep_sheet')) {
                router.push("/prep-sheet");
              } else {
                router.push({ pathname: '/paywall', params: { feature: 'prep_sheet', headline: 'Build prep sheets for your whole service' } });
              }
            }}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="clipboard-outline" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/recipe/edit");
            }}
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* STATS DASHBOARD */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>RECIPES</Text>
            <Text style={styles.statValue}>{stats.recipeCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>PRICES TRACKED</Text>
            <Text style={styles.statValue}>{stats.priceCount}</Text>
          </View>
        </View>
      )}

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = item === selectedCategory;
            return (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(item);
                }}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* STATION FILTER */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", ...STATIONS]}
          keyExtractor={(item) => `station-${item}`}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = item === selectedStation;
            return (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedStation(item);
                }}
                style={[styles.categoryChip, isActive && styles.stationChipActive]}
              >
                <Ionicons name="location-outline" size={12} color={isActive ? Colors.textPrimary : Colors.textMuted} />
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: item.id } })}
            onLongPress={() => handleDeleteRecipe(item)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          filteredRecipes.length === 0 && styles.listEmpty,
        ]}
        scrollEnabled={!!filteredRecipes.length}
        ListHeaderComponent={
          tier === 'free' && recipes.length >= 7 ? (
            <Pressable
              onPress={() => router.push('/paywall')}
              style={styles.nudgeBanner}
            >
              <Ionicons name="star" size={16} color={Colors.accent} />
              <Text style={styles.nudgeText}>
                {recipes.length >= maxFreeRecipes
                  ? `Recipe limit reached (${maxFreeRecipes}/${maxFreeRecipes})`
                  : `${maxFreeRecipes - recipes.length} free recipe${maxFreeRecipes - recipes.length === 1 ? '' : 's'} remaining`}
                {' — '}
                <Text style={styles.nudgeLink}>Upgrade</Text>
              </Text>
            </Pressable>
          ) : null
        }
        ListFooterComponent={
          recipes.length >= 20 ? (
            <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md }}>
              <CrossPromoCard sourceApp="chefscale" targetApp="mycookbook" placement="home-organize" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyGradient}>
              <View style={styles.emptyIconRing}>
                <Ionicons name="restaurant" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Your Kitchen Awaits</Text>
              <Text style={styles.emptyTagline}>
                Scale recipes. Track costs. Cook with confidence.
              </Text>
              <Pressable
                onPress={() => router.push("/recipe/edit")}
                style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.emptyButtonText}>Add Your First Recipe</Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDeep,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "DMSans_700Bold",
    textShadowColor: 'rgba(217,119,6,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  headerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontFamily: 'DMSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontFamily: MONO_FONT,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  categoriesContainer: {
    marginBottom: Spacing.md,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stationChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "DMSans_600SemiBold",
  },
  categoryTextActive: {
    color: Colors.textPrimary,
  },
  list: {
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 24,
    marginHorizontal: 20,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '1A',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5F5F4',
    fontFamily: 'DMSans_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DMSans_700Bold',
  },
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  nudgeText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontFamily: 'DMSans_400Regular',
    flex: 1,
  },
  nudgeLink: {
    fontFamily: 'DMSans_600SemiBold',
    textDecorationLine: 'underline' as const,
  },
});
