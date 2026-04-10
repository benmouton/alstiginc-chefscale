import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget, MONO_FONT } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import type { RecipeWithDetails, RecipeRow } from "@/lib/database";
import { scaleAmount } from "@/lib/scaling";
import { calculateRecipeCost } from "@/lib/costs";
import { detectAllergens } from "@/lib/allergens";
import { DIETARY_FLAGS } from "@/constants/allergens";
import ScalingControls from "@/components/ScalingControls";
import IngredientRow from "@/components/IngredientRow";
import InstructionStep from "@/components/InstructionStep";
import CostSummary from "@/components/CostSummary";
import { AllergenList } from "@/components/AllergenBadge";
import TimerOverlay from "@/components/TimerOverlay";
import PremiumGate from "@/components/PremiumGate";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import MyCookbookPromo from "@/components/MyCookbookPromo";

function CookModeButton({ recipeId, currentServings }: { recipeId: string; currentServings: number }) {
  const checkAccess = useSubscriptionStore((s) => s.checkAccess);
  const getPaywallHeadline = useSubscriptionStore((s) => s.getPaywallHeadline);
  const hasCookMode = checkAccess('cook_mode');

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!hasCookMode) {
      router.push({ pathname: '/paywall', params: { feature: 'cook_mode', headline: getPaywallHeadline('cook_mode') } });
    } else {
      router.push({ pathname: '/recipe/cook-mode', params: { id: recipeId, servings: String(currentServings) } });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [cookModeStyles.cookModeBtnOuter, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
      testID="cook-mode-btn"
    >
      <Ionicons name="flame" size={22} color="#FFF" />
      <Text style={cookModeStyles.cookModeText}>Cook Mode</Text>
      {!hasCookMode ? <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.6)" /> : null}
    </Pressable>
  );
}

const cookModeStyles = StyleSheet.create({
  cookModeBtnOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cookModeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DMSans_700Bold',
  },
});

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { loadRecipeDetail, prices, loadPrices, removeRecipe, toggleFavorite, saveRecipe } = useRecipeStore();
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentServings, setCurrentServings] = useState(1);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [timerState, setTimerState] = useState<{ visible: boolean; minutes: number; stepNumber: number }>({
    visible: false,
    minutes: 0,
    stepNumber: 0,
  });
  const [variations, setVariations] = useState<RecipeRow[]>([]);
  const [subrecipeNames, setSubrecipeNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      if (id) {
        await loadPrices();
        const r = await loadRecipeDetail(id);
        if (r) {
          setRecipe(r);
          setCurrentServings(r.baseServings);

          // Load variations
          try {
            const { getVariationsByParentId, getRecipeBasicById } = await import('@/lib/database');
            const parentId = r.parentRecipeId || r.id;
            const vars = await getVariationsByParentId(parentId);
            setVariations(vars.filter((v) => v.id !== r.id));

            // Load subrecipe names
            const subIds = r.ingredients.filter((i) => i.subrecipeId).map((i) => i.subrecipeId);
            if (subIds.length > 0) {
              const names: Record<string, string> = {};
              for (const subId of subIds) {
                const basic = await getRecipeBasicById(subId);
                if (basic) names[subId] = basic.name;
              }
              setSubrecipeNames(names);
            }
          } catch (e) {
            console.warn('Failed to load variations/subrecipes:', e);
          }
        }
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isScaled = recipe ? currentServings !== recipe.baseServings : false;

  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) =>
      scaleAmount(
        ing.amount,
        recipe.baseServings,
        currentServings,
        ing.unit,
        ing.isScalable !== 0
      )
    );
  }, [recipe, currentServings]);

  const scaledAmounts = useMemo(() => {
    return scaledIngredients.map((s) => s.amount);
  }, [scaledIngredients]);

  const costSummary = useMemo(() => {
    if (!recipe) return null;
    return calculateRecipeCost(recipe.ingredients, scaledAmounts, prices, currentServings);
  }, [recipe, scaledAmounts, prices, currentServings]);

  const allergens = useMemo(() => {
    if (!recipe) return [];
    return detectAllergens(recipe.ingredients.map((i) => i.name));
  }, [recipe]);

  const ingredientsByCategory = useMemo(() => {
    if (!recipe) return [];
    const groups: { category: string; indices: number[] }[] = [];
    let currentCat = '';
    recipe.ingredients.forEach((ing, idx) => {
      const cat = ing.category || '';
      if (cat !== currentCat || groups.length === 0) {
        groups.push({ category: cat, indices: [idx] });
        currentCat = cat;
      } else {
        groups[groups.length - 1].indices.push(idx);
      }
    });
    const hasCategories = groups.some((g) => g.category !== '');
    return hasCategories ? groups : [{ category: '', indices: recipe.ingredients.map((_, i) => i) }];
  }, [recipe]);

  const totalTime = recipe ? recipe.prepTime + recipe.cookTime : 0;

  const handleDelete = () => {
    if (!recipe) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete Recipe", `Are you sure you want to delete "${recipe.name}"? This cannot be undone.`, [
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

  const handleToggleFavorite = useCallback(async () => {
    if (!recipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = recipe.isFavorite === 1 ? 0 : 1;
    await toggleFavorite(recipe.id, newVal === 1);
    setRecipe({ ...recipe, isFavorite: newVal });
  }, [recipe, toggleFavorite]);

  const handleDuplicate = useCallback(async () => {
    if (!recipe) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const crypto = await import("expo-crypto");
    const newId = crypto.randomUUID();
    await saveRecipe({
      ...recipe,
      id: newId,
      name: `${recipe.name} (Copy)`,
      isFavorite: 0,
      ingredients: recipe.ingredients.map((ing) => ({
        ...ing,
        id: crypto.randomUUID(),
        recipeId: newId,
      })),
      instructions: recipe.instructions.map((inst) => ({
        ...inst,
        id: crypto.randomUUID(),
        recipeId: newId,
      })),
    });
    router.replace({ pathname: "/recipe/[id]", params: { id: newId } });
  }, [recipe, saveRecipe]);

  const handleCreateVariation = useCallback(async () => {
    if (!recipe) return;
    const checkAccess = useSubscriptionStore.getState().checkAccess;
    if (!checkAccess('recipe_variations')) {
      router.push({ pathname: '/paywall', params: { feature: 'recipe_variations', headline: 'Create and link recipe variations' } });
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const crypto = await import("expo-crypto");
    const newId = crypto.randomUUID();
    const parentId = recipe.parentRecipeId || recipe.id;
    await saveRecipe({
      ...recipe,
      id: newId,
      name: `${recipe.name} (Variation)`,
      isFavorite: 0,
      parentRecipeId: parentId,
      variationLabel: '',
      ingredients: recipe.ingredients.map((ing) => ({
        ...ing,
        id: crypto.randomUUID(),
        recipeId: newId,
      })),
      instructions: recipe.instructions.map((inst) => ({
        ...inst,
        id: crypto.randomUUID(),
        recipeId: newId,
      })),
    });
    router.push({ pathname: "/recipe/edit", params: { id: newId } });
  }, [recipe, saveRecipe]);

  const handleTimerPress = useCallback((minutes: number, stepNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimerState({ visible: true, minutes, stepNumber });
  }, []);

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
        <Text style={styles.notFoundText}>Recipe not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const hasPhoto = !!recipe.imageUri;
  const isFavorite = recipe.isFavorite === 1;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <View style={[styles.hero, { paddingTop: insets.top + webTopInset }]}>
          {hasPhoto ? (
            <Image source={{ uri: recipe.imageUri }} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark, Colors.backgroundDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            />
          )}
          <LinearGradient
            colors={[Colors.backgroundDeep + '80', 'transparent', Colors.backgroundDeep + 'F2']}
            locations={[0, 0.35, 1]}
            style={styles.heroOverlay}
          />

          <View style={styles.heroTopBar}>
            <Pressable
              onPress={() => router.back()}
              style={styles.heroBtn}
              testID="back-btn"
            >
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </Pressable>
            <View style={styles.heroTopBarRight}>
              <Pressable
                onPress={handleToggleFavorite}
                style={styles.heroBtn}
                testID="favorite-btn"
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={22}
                  color={isFavorite ? "#EF4444" : Colors.textPrimary}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: "/recipe/edit", params: { id: recipe.id } });
                }}
                style={styles.heroBtn}
                testID="edit-btn"
              >
                <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroName}>{recipe.name}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* INFO BAR */}
          <View style={styles.infoBar}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillText}>{recipe.category}</Text>
            </View>
            {recipe.prepTime > 0 ? (
              <View style={styles.infoPill}>
                <Ionicons name="timer-outline" size={14} color={Colors.primary} />
                <Text style={styles.infoPillText}>Prep {recipe.prepTime}m</Text>
              </View>
            ) : null}
            {recipe.cookTime > 0 ? (
              <View style={styles.infoPill}>
                <Ionicons name="flame-outline" size={14} color={Colors.accent} />
                <Text style={styles.infoPillText}>Cook {recipe.cookTime}m</Text>
              </View>
            ) : null}
            {totalTime > 0 ? (
              <View style={styles.infoPill}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoPillText}>Total {totalTime}m</Text>
              </View>
            ) : null}
            {recipe.station ? (
              <View style={styles.infoPill}>
                <Ionicons name="location-outline" size={14} color={Colors.primaryLight} />
                <Text style={styles.infoPillText}>{recipe.station}</Text>
              </View>
            ) : null}
            {(() => {
              try {
                const flags: string[] = JSON.parse(recipe.dietaryFlags || '[]');
                return flags.map((flagId) => {
                  const flag = DIETARY_FLAGS.find((f) => f.id === flagId);
                  if (!flag) return null;
                  return (
                    <View key={flag.id} style={[styles.infoPill, { borderColor: flag.color + '40' }]}>
                      <Ionicons name={flag.icon as any} size={14} color={flag.color} />
                      <Text style={[styles.infoPillText, { color: flag.color }]}>{flag.name}</Text>
                    </View>
                  );
                });
              } catch { return null; }
            })()}
          </View>

          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : null}

          <Text style={styles.baseYield}>
            Makes {recipe.baseServings} {recipe.baseYieldUnit || "servings"}
          </Text>

          {/* SCALING CONTROLS */}
          <View style={styles.section}>
            <ScalingControls
              originalServings={recipe.baseServings}
              currentServings={currentServings}
              onServingsChange={setCurrentServings}
              yieldUnit={recipe.baseYieldUnit || "servings"}
            />
          </View>

          {/* INGREDIENTS */}
          {recipe.ingredients.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list-outline" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>
                    Ingredients ({recipe.ingredients.length})
                  </Text>
                </View>
                {ingredientsByCategory.map((group, gIdx) => (
                  <View key={`grp-${gIdx}`}>
                    {group.category ? (
                      <View style={[styles.categoryDivider, gIdx === 0 && { marginTop: 0 }]}>
                        <View style={styles.categoryLine} />
                        <Text style={styles.categoryLabel}>{group.category}</Text>
                        <View style={styles.categoryLine} />
                      </View>
                    ) : null}
                    {group.indices.map((idx) => {
                      const ing = recipe.ingredients[idx];
                      return (
                        <IngredientRow
                          key={ing.id}
                          name={ing.name}
                          scaleResult={scaledIngredients[idx]}
                          prepNote={ing.prepNote || undefined}
                          isScalable={ing.isScalable !== 0}
                          cost={costSummary?.ingredientCosts[idx]?.cost}
                          isScaled={isScaled}
                          yieldPercent={ing.yieldPercent}
                          subrecipeName={ing.subrecipeId ? subrecipeNames[ing.subrecipeId] : undefined}
                          onSubrecipePress={ing.subrecipeId ? () => router.push({ pathname: '/recipe/[id]', params: { id: ing.subrecipeId } }) : undefined}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* INSTRUCTIONS */}
          {recipe.instructions.length > 0 ? (
            <View style={styles.section}>
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
                    timerMinutes={inst.timerMinutes}
                    temperature={inst.temperature}
                    photoUri={inst.photoUri || undefined}
                    onTimerPress={
                      inst.timerMinutes
                        ? () => handleTimerPress(inst.timerMinutes!, inst.stepNumber)
                        : undefined
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* COST SUMMARY */}
          {costSummary && costSummary.ingredientCosts.some((c) => c.hasPriceData) ? (
            <View style={styles.section}>
              <PremiumGate
                feature="cost_calculator"
                fallbackTitle="Cost Calculator"
                fallbackDescription="See your exact food cost per plate"
              >
                <CostSummary summary={costSummary} />
              </PremiumGate>
            </View>
          ) : null}

          {/* ALLERGENS */}
          {allergens.length > 0 ? (
            <View style={styles.section}>
              <AllergenList allergens={allergens} />
            </View>
          ) : null}

          {/* PHOTO GALLERY */}
          {recipe.photos && recipe.photos.filter((p) => p.photoType !== 'plating').length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="images-outline" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Photos</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScrollContent}
                >
                  {recipe.photos.filter((p) => p.photoType !== 'plating').map((photo) => (
                    <View key={photo.id} style={styles.galleryPhotoItem}>
                      <Image source={{ uri: photo.uri }} style={styles.galleryPhotoImage} />
                      {photo.caption ? (
                        <Text style={styles.galleryPhotoCaption}>{photo.caption}</Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : null}

          {/* PLATING REFERENCE PHOTOS */}
          {recipe.photos && recipe.photos.filter((p) => p.photoType === 'plating').length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="color-palette-outline" size={20} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Plating Guide</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScrollContent}
                >
                  {recipe.photos.filter((p) => p.photoType === 'plating').map((photo) => (
                    <View key={photo.id} style={styles.galleryPhotoItem}>
                      <Image source={{ uri: photo.uri }} style={styles.galleryPhotoImage} />
                      {photo.caption ? (
                        <Text style={styles.galleryPhotoCaption}>{photo.caption}</Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : null}

          {/* RECIPE VARIATIONS */}
          {variations.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="git-branch-outline" size={20} color={Colors.primaryLight} />
                  <Text style={styles.sectionTitle}>Variations</Text>
                </View>
                {variations.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: v.id } })}
                    style={({ pressed }) => [styles.variationRow, pressed && { opacity: 0.7 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.variationName}>{v.name}</Text>
                      {v.variationLabel ? (
                        <Text style={styles.variationLabel}>{v.variationLabel}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* CHEF'S NOTES */}
          {recipe.notes ? (
            <View style={styles.section}>
              <Pressable
                onPress={() => setNotesExpanded(!notesExpanded)}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.sectionTitle}>Chef&apos;s Notes</Text>
                  <View style={{ flex: 1 }} />
                  <Ionicons
                    name={notesExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={Colors.textMuted}
                  />
                </View>
                {notesExpanded ? (
                  <Text style={styles.notesText}>{recipe.notes}</Text>
                ) : (
                  <Text style={styles.notesPreview} numberOfLines={2}>{recipe.notes}</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {/* MYCOOKBOOK PROMO */}
          <View style={styles.section}>
            <MyCookbookPromo trigger="cooking" compact />
          </View>

          {/* BOTTOM ACTIONS */}
          <View style={styles.actionsSection}>
            <CookModeButton recipeId={recipe.id} currentServings={currentServings} />


            <Pressable
              onPress={handleDuplicate}
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnOutline, pressed && { opacity: 0.7 }]}
              testID="duplicate-btn"
            >
              <Ionicons name="copy-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionBtnOutlineText}>Duplicate Recipe</Text>
            </Pressable>

            <Pressable
              onPress={handleCreateVariation}
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnOutline, pressed && { opacity: 0.7 }]}
              testID="variation-btn"
            >
              <Ionicons name="git-branch-outline" size={20} color={Colors.primaryLight} />
              <Text style={styles.actionBtnOutlineText}>Create Variation</Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && { opacity: 0.7 }]}
              testID="delete-btn"
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={styles.actionBtnDangerText}>Delete Recipe</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <TimerOverlay
        visible={timerState.visible}
        minutes={timerState.minutes}
        stepNumber={timerState.stepNumber}
        onClose={() => setTimerState({ visible: false, minutes: 0, stepNumber: 0 })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDeep,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontFamily: "DMSans_600SemiBold",
  },
  backLink: {
    marginTop: Spacing.md,
  },
  backLinkText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontFamily: "DMSans_600SemiBold",
  },

  hero: {
    height: 340,
    position: "relative",
    justifyContent: "space-between",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    zIndex: 1,
  },
  heroTopBarRight: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15,17,21,0.6)",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    zIndex: 1,
  },
  heroName: {
    fontSize: 34,
    fontWeight: "700",
    color: '#FFFFFF',
    fontFamily: "DMSans_700Bold",
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  infoBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  infoPillText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "DMSans_600SemiBold",
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  baseYield: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: Spacing.lg,
  },

  section: {
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
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textSecondary,
    fontFamily: "DMSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  categoryDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  categoryLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  categoryLabel: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontFamily: 'DMSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  notesText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },
  notesPreview: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },

  actionsSection: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: TouchTarget.min,
  },
  cookModeBtn: {
    backgroundColor: Colors.primary,
  },
  cookModeText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'DMSans_700Bold',
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionBtnOutlineText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontFamily: "DMSans_600SemiBold",
  },
  actionBtnDanger: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  actionBtnDangerText: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontFamily: "DMSans_600SemiBold",
  },

  variationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  variationName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'DMSans_600SemiBold',
  },
  variationLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  galleryScrollContent: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  galleryPhotoItem: {
    width: 160,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.backgroundDark,
  },
  galleryPhotoImage: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.md,
  },
  galleryPhotoCaption: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: "DMSans_400Regular",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
});
