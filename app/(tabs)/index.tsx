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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import type { RecipeRow } from "@/lib/database";
import RecipeCard from "@/components/RecipeCard";
import MyCookbookPromo from "@/components/MyCookbookPromo";

const CATEGORIES = ["All", "Entr\u00e9e", "Appetizer", "Sauce", "Dessert", "Prep", "Side", "Beverage"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, isLoading, loadRecipes, removeRecipe } = useRecipeStore();
  const { tier, recipeCount, maxFreeRecipes, setRecipeCount } = useSubscriptionStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  const filteredRecipes = selectedCategory === "All"
    ? recipes
    : recipes.filter((r) => r.category === selectedCategory);

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
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/recipe/edit");
          }}
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </Pressable>
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
            <Ionicons name="restaurant-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add your first recipe
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  categoriesContainer: {
    marginBottom: Spacing.md,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    paddingHorizontal: Spacing.xxxl,
  },
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.accent + '15',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
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
