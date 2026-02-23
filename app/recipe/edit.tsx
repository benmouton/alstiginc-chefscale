import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { COMMON_UNITS, UNITS } from "@/constants/units";
import type { IngredientRow, InstructionRow } from "@/lib/database";

const CATEGORIES = ["Entr\u00e9e", "Appetizer", "Sauce", "Dessert", "Prep", "Side", "Beverage"];

interface EditableIngredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface EditableInstruction {
  id: string;
  text: string;
}

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { loadRecipeDetail, saveRecipe } = useRecipeStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Entr\u00e9e");
  const [servings, setServings] = useState("4");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [notes, setNotes] = useState("");

  const [ingredients, setIngredients] = useState<EditableIngredient[]>([
    { id: Crypto.randomUUID(), name: "", quantity: "", unit: "cup" },
  ]);

  const [instructions, setInstructions] = useState<EditableInstruction[]>([
    { id: Crypto.randomUUID(), text: "" },
  ]);

  const isEditing = !!id;

  useEffect(() => {
    if (id) {
      (async () => {
        const recipe = await loadRecipeDetail(id);
        if (recipe) {
          setName(recipe.name);
          setDescription(recipe.description);
          setCategory(recipe.category);
          setServings(recipe.baseServings.toString());
          setPrepTime(recipe.prepTime > 0 ? recipe.prepTime.toString() : "");
          setCookTime(recipe.cookTime > 0 ? recipe.cookTime.toString() : "");
          setNotes(recipe.notes);
          if (recipe.ingredients.length > 0) {
            setIngredients(
              recipe.ingredients.map((i) => ({
                id: i.id,
                name: i.name,
                quantity: i.amount.toString(),
                unit: i.unit,
              }))
            );
          }
          if (recipe.instructions.length > 0) {
            setInstructions(
              recipe.instructions.map((i) => ({
                id: i.id,
                text: i.text,
              }))
            );
          }
        }
      })();
    }
  }, [id]);

  const addIngredient = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients((prev) => [
      ...prev,
      { id: Crypto.randomUUID(), name: "", quantity: "", unit: "cup" },
    ]);
  };

  const removeIngredient = (ingId: string) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((i) => i.id !== ingId));
  };

  const updateIngredient = (ingId: string, field: keyof EditableIngredient, value: string) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === ingId ? { ...i, [field]: value } : i))
    );
  };

  const addInstruction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInstructions((prev) => [
      ...prev,
      { id: Crypto.randomUUID(), text: "" },
    ]);
  };

  const removeInstruction = (instId: string) => {
    if (instructions.length <= 1) return;
    setInstructions((prev) => prev.filter((i) => i.id !== instId));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a recipe name.");
      return;
    }

    const validIngredients = ingredients.filter((i) => i.name.trim() && i.quantity.trim());
    const validInstructions = instructions.filter((i) => i.text.trim());

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const recipeId = id || Crypto.randomUUID();
    await saveRecipe({
      id: recipeId,
      name: name.trim(),
      description: description.trim(),
      category,
      tags: '[]',
      baseServings: parseInt(servings) || 4,
      baseYieldUnit: 'servings',
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      imageUri: "",
      notes: notes.trim(),
      source: '',
      isFavorite: 0,
      ingredients: validIngredients.map((ing, idx) => ({
        id: ing.id,
        recipeId,
        name: ing.name.trim(),
        amount: parseFloat(ing.quantity) || 0,
        unit: ing.unit,
        category: '',
        costPerUnit: null,
        costUnit: null,
        fdcId: null,
        isOptional: 0,
        isScalable: 1,
        prepNote: '',
        sortOrder: idx,
      })),
      instructions: validInstructions.map((inst, idx) => ({
        id: inst.id,
        recipeId,
        stepNumber: idx + 1,
        text: inst.text.trim(),
        timerMinutes: null,
        temperature: '',
        sortOrder: idx,
      })),
    });

    router.back();
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.topBarButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>
          {isEditing ? "Edit Recipe" : "New Recipe"}
        </Text>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="checkmark" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.inputLabel}>Recipe Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Grandma's Chocolate Cake"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Brief description..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.chip, category === cat && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.rowThree}>
          <View style={styles.thirdInput}>
            <Text style={styles.inputLabel}>Servings</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServings}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.thirdInput}>
            <Text style={styles.inputLabel}>Prep (min)</Text>
            <TextInput
              style={styles.input}
              value={prepTime}
              onChangeText={setPrepTime}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.thirdInput}>
            <Text style={styles.inputLabel}>Cook (min)</Text>
            <TextInput
              style={styles.input}
              value={cookTime}
              onChangeText={setCookTime}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Ingredients</Text>
          <Pressable onPress={addIngredient}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </Pressable>
        </View>

        {ingredients.map((ing, idx) => (
          <View key={ing.id} style={styles.ingredientEditRow}>
            <View style={styles.ingredientFields}>
              <View style={styles.qtyUnitRow}>
                <TextInput
                  style={[styles.input, styles.qtyInput]}
                  value={ing.quantity}
                  onChangeText={(v) => updateIngredient(ing.id, "quantity", v)}
                  placeholder="Qty"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.unitScroll}
                  contentContainerStyle={styles.unitScrollContent}
                >
                  {COMMON_UNITS.map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => updateIngredient(ing.id, "unit", u)}
                      style={[styles.unitMini, ing.unit === u && styles.unitMiniActive]}
                    >
                      <Text
                        style={[
                          styles.unitMiniText,
                          ing.unit === u && styles.unitMiniTextActive,
                        ]}
                      >
                        {UNITS[u]?.abbreviation || u}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <TextInput
                style={[styles.input, { marginTop: Spacing.xs }]}
                value={ing.name}
                onChangeText={(v) => updateIngredient(ing.id, "name", v)}
                placeholder="Ingredient name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            {ingredients.length > 1 ? (
              <Pressable
                onPress={() => removeIngredient(ing.id)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={22} color={Colors.error} />
              </Pressable>
            ) : null}
          </View>
        ))}

        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionLabel}>Instructions</Text>
          <Pressable onPress={addInstruction}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </Pressable>
        </View>

        {instructions.map((inst, idx) => (
          <View key={inst.id} style={styles.instructionEditRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{idx + 1}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.instructionInput]}
              value={inst.text}
              onChangeText={(v) =>
                setInstructions((prev) =>
                  prev.map((i) => (i.id === inst.id ? { ...i, text: v } : i))
                )
              }
              placeholder={`Step ${idx + 1}...`}
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            {instructions.length > 1 ? (
              <Pressable
                onPress={() => removeInstruction(inst.id)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={22} color={Colors.error} />
              </Pressable>
            ) : null}
          </View>
        ))}

        <Text style={[styles.inputLabel, { marginTop: Spacing.xxl }]}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes, tips, variations..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
        />

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.mainSaveButton, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.mainSaveButtonText}>
            {isEditing ? "Update Recipe" : "Save Recipe"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
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
  topBarTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: Spacing.xs,
    marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchTarget.min,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chipScroll: {
    marginBottom: Spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
  rowThree: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  thirdInput: {
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  ingredientEditRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientFields: {
    flex: 1,
  },
  qtyUnitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  qtyInput: {
    width: 64,
    textAlign: "center",
  },
  unitScroll: {
    flex: 1,
  },
  unitScrollContent: {
    gap: 4,
    alignItems: "center",
  },
  unitMini: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.backgroundDark,
  },
  unitMiniActive: {
    backgroundColor: Colors.primary,
  },
  unitMiniText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_600SemiBold",
  },
  unitMiniTextActive: {
    color: Colors.textPrimary,
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  instructionEditRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
    marginTop: Spacing.md,
  },
  stepNumberText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  instructionInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: "top",
  },
  mainSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.xxl,
    minHeight: TouchTarget.min,
    justifyContent: "center",
  },
  mainSaveButtonText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
});
