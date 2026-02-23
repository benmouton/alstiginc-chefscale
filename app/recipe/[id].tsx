import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";
import { useRecipeStore, type Recipe } from "@/store/useRecipeStore";
import { scaleQuantity } from "@/lib/scaling";
import { calculateRecipeCost } from "@/lib/costs";
import { detectAllergens } from "@/lib/allergens";
import ScalingControls from "@/components/ScalingControls";
import IngredientRow from "@/components/IngredientRow";
import InstructionStep from "@/components/InstructionStep";
import CostSummary from "@/components/CostSummary";
import { AllergenList } from "@/components/AllergenBadge";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { loadRecipeDetail, prices, loadPrices, removeRecipe } = useRecipeStore();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentServings, setCurrentServings] = useState(1);

  useEffect(() => {
    (async () => {
      if (id) {
        await loadPrices();
        const r = await loadRecipeDetail(id);
        if (r) {
          setRecipe(r);
          setCurrentServings(r.servings);
        }
        setLoading(false);
      }
    })();
  }, [id]);

  const isScaled = recipe ? currentServings !== recipe.servings : false;

  const scaledQuantities = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) =>
      scaleQuantity(ing.quantity, recipe.servings, currentServings)
    );
  }, [recipe, currentServings]);

  const costSummary = useMemo(() => {
    if (!recipe) return null;
    return calculateRecipeCost(recipe.ingredients, scaledQuantities, prices, currentServings);
  }, [recipe, scaledQuantities, prices, currentServings]);

  const allergens = useMemo(() => {
    if (!recipe) return [];
    return detectAllergens(recipe.ingredients.map((i) => i.name));
  }, [recipe]);

  const totalTime = recipe ? recipe.prepTime + recipe.cookTime : 0;

  const handleDelete = () => {
    if (!recipe) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete Recipe", `Delete "${recipe.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeRecipe(recipe.id);
          router.back();
        },
      },
    ]);
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + webTopInset }]}>
        <Text style={styles.errorText}>Recipe not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.topBarButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.topBarActions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/recipe/edit", params: { id: recipe.id } });
            }}
            style={styles.topBarButton}
          >
            <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.topBarButton}>
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.category}>{recipe.category}</Text>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          {recipe.description ? (
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            {recipe.prepTime > 0 ? (
              <View style={styles.metaChip}>
                <Ionicons name="timer-outline" size={16} color={Colors.primary} />
                <Text style={styles.metaChipText}>Prep {recipe.prepTime}m</Text>
              </View>
            ) : null}
            {recipe.cookTime > 0 ? (
              <View style={styles.metaChip}>
                <Ionicons name="flame-outline" size={16} color={Colors.accent} />
                <Text style={styles.metaChipText}>Cook {recipe.cookTime}m</Text>
              </View>
            ) : null}
            {totalTime > 0 ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.metaChipText}>Total {totalTime}m</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionSpacing}>
          <ScalingControls
            originalServings={recipe.servings}
            currentServings={currentServings}
            onServingsChange={setCurrentServings}
          />
        </View>

        {recipe.ingredients.length > 0 ? (
          <View style={styles.sectionSpacing}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>
                  Ingredients ({recipe.ingredients.length})
                </Text>
              </View>
              {recipe.ingredients.map((ing, idx) => (
                <IngredientRow
                  key={ing.id}
                  name={ing.name}
                  quantity={ing.quantity}
                  unit={ing.unit}
                  scaledQuantity={scaledQuantities[idx]}
                  cost={costSummary?.ingredientCosts[idx]?.cost}
                  isScaled={isScaled}
                />
              ))}
            </View>
          </View>
        ) : null}

        {recipe.instructions.length > 0 ? (
          <View style={styles.sectionSpacing}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="reader-outline" size={20} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Instructions</Text>
              </View>
              {recipe.instructions.map((inst) => (
                <InstructionStep
                  key={inst.id}
                  stepNumber={inst.stepNumber}
                  text={inst.text}
                />
              ))}
            </View>
          </View>
        ) : null}

        {costSummary && costSummary.ingredientCosts.some((c) => c.hasPriceData) ? (
          <View style={styles.sectionSpacing}>
            <CostSummary summary={costSummary} />
          </View>
        ) : null}

        {allergens.length > 0 ? (
          <View style={styles.sectionSpacing}>
            <AllergenList allergens={allergens} />
          </View>
        ) : null}

        {recipe.notes ? (
          <View style={styles.sectionSpacing}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
              <Text style={styles.notesText}>{recipe.notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  backLink: {
    marginTop: Spacing.md,
  },
  backLinkText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.md,
  },
  category: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  recipeName: {
    fontSize: FontSize.display,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  recipeDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  sectionSpacing: {
    marginBottom: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  notesText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
