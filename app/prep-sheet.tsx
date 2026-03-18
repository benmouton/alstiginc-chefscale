import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  Share,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { getRecipeWithDetails } from "@/lib/database";
import {
  buildPrepSheet,
  formatPrepSheetText,
  type AggregatedIngredient,
} from "@/lib/prepSheet";

const MULTIPLIER_PRESETS = [1, 2, 3, 5];

interface Selection {
  recipeId: string;
  multiplier: number;
  customMultiplier: string;
}

export default function PrepSheetScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, loadRecipes } = useRecipeStore();

  const [selections, setSelections] = useState<Map<string, Selection>>(new Map());
  const [results, setResults] = useState<AggregatedIngredient[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const toggleRecipe = (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelections((prev) => {
      const next = new Map(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.set(recipeId, { recipeId, multiplier: 1, customMultiplier: '' });
      }
      return next;
    });
  };

  const setMultiplier = (recipeId: string, multiplier: number) => {
    Haptics.selectionAsync();
    setSelections((prev) => {
      const next = new Map(prev);
      const existing = next.get(recipeId);
      if (existing) {
        next.set(recipeId, { ...existing, multiplier, customMultiplier: '' });
      }
      return next;
    });
  };

  const setCustomMultiplier = (recipeId: string, text: string) => {
    setSelections((prev) => {
      const next = new Map(prev);
      const existing = next.get(recipeId);
      if (existing) {
        const parsed = parseFloat(text);
        next.set(recipeId, {
          ...existing,
          customMultiplier: text,
          multiplier: isNaN(parsed) || parsed <= 0 ? existing.multiplier : parsed,
        });
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selections.size === 0) return;

    setIsGenerating(true);
    try {
      const prepSelections = [];
      for (const sel of selections.values()) {
        const details = await getRecipeWithDetails(sel.recipeId);
        if (details) {
          prepSelections.push({ recipe: details, multiplier: sel.multiplier });
        }
      }

      if (prepSelections.length === 0) {
        Alert.alert('Error', 'Could not load recipe details.');
        setIsGenerating(false);
        return;
      }

      const aggregated = buildPrepSheet(prepSelections);
      setResults(aggregated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate prep sheet.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!results) return;

    const recipeNames = Array.from(selections.values())
      .map((sel) => {
        const recipe = recipes.find((r) => r.id === sel.recipeId);
        return recipe ? `${recipe.name} (x${sel.multiplier})` : '';
      })
      .filter(Boolean);

    const title = recipeNames.join(', ');
    const text = formatPrepSheetText(results, title);

    try {
      await Share.share({ message: text });
    } catch {
      // user cancelled
    }
  };

  const handleBack = () => {
    if (results) {
      setResults(null);
    } else {
      router.back();
    }
  };

  const selectedCount = selections.size;

  // Results view
  if (results) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Prep Sheet</Text>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.dateStamp}>
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        <Text style={styles.resultsSummary}>
          {results.length} ingredient{results.length !== 1 ? 's' : ''} from {selectedCount} recipe{selectedCount !== 1 ? 's' : ''}
        </Text>

        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.name}-${item.unit}-${index}`}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => (
            <View style={styles.resultRow}>
              <View style={styles.resultAmountCol}>
                <Text style={styles.resultAmount}>{item.display}</Text>
              </View>
              <View style={styles.resultNameCol}>
                <Text style={styles.resultName}>{item.name}</Text>
                {item.sources.length > 1 && (
                  <Text style={styles.resultSources}>
                    {item.sources.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No ingredients to aggregate.</Text>
            </View>
          }
        />

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.generateBtnText}>Share Prep Sheet</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Selection view
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Prep Sheet</Text>
        <View style={styles.headerBtn} />
      </View>

      <Text style={styles.instructions}>
        Select recipes and set multipliers to generate a consolidated prep list.
      </Text>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.recipeList}
        renderItem={({ item }) => {
          const isSelected = selections.has(item.id);
          const sel = selections.get(item.id);

          return (
            <Pressable
              onPress={() => toggleRecipe(item.id)}
              style={[styles.recipeCard, isSelected && styles.recipeCardSelected]}
            >
              <View style={styles.recipeCardHeader}>
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isSelected ? Colors.primary : Colors.textMuted}
                />
                <View style={styles.recipeCardInfo}>
                  <Text style={styles.recipeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.recipeCategory}>
                    {item.category} · {item.baseServings} {item.baseYieldUnit}
                  </Text>
                </View>
              </View>

              {isSelected && sel && (
                <View style={styles.multiplierRow}>
                  <Text style={styles.multiplierLabel}>Multiply:</Text>
                  {MULTIPLIER_PRESETS.map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setMultiplier(item.id, m)}
                      style={[
                        styles.multiplierChip,
                        sel.multiplier === m && !sel.customMultiplier && styles.multiplierChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.multiplierChipText,
                          sel.multiplier === m && !sel.customMultiplier && styles.multiplierChipTextActive,
                        ]}
                      >
                        x{m}
                      </Text>
                    </Pressable>
                  ))}
                  <TextInput
                    style={[
                      styles.customMultiplierInput,
                      sel.customMultiplier ? styles.customMultiplierInputActive : null,
                    ]}
                    value={sel.customMultiplier}
                    onChangeText={(text) => setCustomMultiplier(item.id, text)}
                    placeholder="x?"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No recipes yet. Add some first!</Text>
          </View>
        }
      />

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          onPress={handleGenerate}
          disabled={selectedCount === 0 || isGenerating}
          style={({ pressed }) => [
            styles.generateBtn,
            (selectedCount === 0 || isGenerating) && styles.generateBtnDisabled,
            pressed && selectedCount > 0 && { opacity: 0.8 },
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.textPrimary} />
          ) : (
            <Ionicons name="clipboard-outline" size={20} color={Colors.textPrimary} />
          )}
          <Text style={[styles.generateBtnText, selectedCount === 0 && styles.generateBtnTextDisabled]}>
            {selectedCount === 0
              ? 'Select Recipes'
              : `Generate Prep Sheet (${selectedCount})`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recipeList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.sm,
  },
  recipeCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recipeCardSelected: {
    borderColor: Colors.primary,
  },
  recipeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  recipeCardInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  recipeCategory: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  multiplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  multiplierLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  multiplierChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multiplierChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  multiplierChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  multiplierChipTextActive: {
    color: Colors.textPrimary,
  },
  customMultiplierInput: {
    width: 48,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    paddingVertical: 0,
  },
  customMultiplierInputActive: {
    borderColor: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    minHeight: TouchTarget.min,
  },
  generateBtnDisabled: {
    backgroundColor: Colors.backgroundElevated,
  },
  generateBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  generateBtnTextDisabled: {
    color: Colors.textMuted,
  },
  dateStamp: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  resultsSummary: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  resultsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  resultRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultAmountCol: {
    width: 100,
    justifyContent: 'center',
  },
  resultAmount: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  resultNameCol: {
    flex: 1,
    justifyContent: 'center',
  },
  resultName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  resultSources: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
});
