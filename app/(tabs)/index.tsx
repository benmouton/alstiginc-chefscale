import React, { useEffect, useCallback, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import type { RecipeRow } from "@/lib/database";
import RecipeCard from "@/components/RecipeCard";
import MyCookbookPromo from "@/components/MyCookbookPromo";
import { STATIONS } from "@/constants/stations";

const CATEGORIES = ["All", "Entr\u00e9e", "Appetizer", "Sauce", "Dessert", "Prep", "Side", "Beverage"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, isLoading, loadRecipes, removeRecipe } = useRecipeStore();
  const { tier, recipeCount, maxFreeRecipes, setRecipeCount } = useSubscriptionStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStation, setSelectedStation] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    setRecipeCount(recipes.length);
  }, [recipes.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  }, [loadRecipes]);

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
            <LinearGradient
              colors={['#D97706', '#B45309']}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

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
              <MyCookbookPromo trigger="organize" />
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
            <LinearGradient
              colors={['#0A0A0A', '#1A1008', '#0A0A0A']}
              style={styles.emptyGradient}
            >
              <View style={styles.emptyIconRing}>
                <Ionicons name="restaurant" size={48} color="#D97706" />
              </View>
              <Text style={styles.emptyTitle}>Your Kitchen Awaits</Text>
              <Text style={styles.emptyTagline}>
                Scale recipes. Track costs. Cook with confidence.
              </Text>
              <Pressable
                onPress={() => router.push("/recipe/edit")}
                style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
              >
                <LinearGradient
                  colors={['#D97706', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.emptyButtonText}>Add Your First Recipe</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
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
    fontFamily: "Inter_700Bold",
    textShadowColor: 'rgba(217,119,6,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
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
    borderRadius: 26,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  stationChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  categoryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
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
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(217,119,6,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(217,119,6,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5F5F4',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
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
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  nudgeLink: {
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline' as const,
  },
});
