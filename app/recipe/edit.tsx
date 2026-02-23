import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Switch,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { COMMON_UNITS, UNITS } from "@/constants/units";

const CATEGORIES = ["Entrée", "Appetizer", "Sauce", "Dessert", "Prep", "Side", "Beverage", "Other"];

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "http://localhost:5000";

interface EditableIngredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  prepNote: string;
  isScalable: boolean;
}

interface EditableInstruction {
  id: string;
  text: string;
  timerMinutes: string;
  temperature: string;
}

interface ValidationErrors {
  name?: string;
  ingredients?: string;
  instructions?: string;
}

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { loadRecipeDetail, saveRecipe } = useRecipeStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Entrée");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [servings, setServings] = useState("4");
  const [yieldUnit, setYieldUnit] = useState("servings");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [unitPickerVisible, setUnitPickerVisible] = useState<string | null>(null);

  const [ingredients, setIngredients] = useState<EditableIngredient[]>([
    { id: Crypto.randomUUID(), name: "", amount: "", unit: "cup", prepNote: "", isScalable: true },
  ]);

  const [instructions, setInstructions] = useState<EditableInstruction[]>([
    { id: Crypto.randomUUID(), text: "", timerMinutes: "", temperature: "" },
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
          try { setTags(JSON.parse(recipe.tags || "[]")); } catch { setTags([]); }
          setServings(recipe.baseServings.toString());
          setYieldUnit(recipe.baseYieldUnit || "servings");
          setPrepTime(recipe.prepTime > 0 ? recipe.prepTime.toString() : "");
          setCookTime(recipe.cookTime > 0 ? recipe.cookTime.toString() : "");
          setNotes(recipe.notes);
          setSource(recipe.source || "");
          setImageUri(recipe.imageUri || "");
          if (recipe.ingredients.length > 0) {
            setIngredients(
              recipe.ingredients.map((i) => ({
                id: i.id,
                name: i.name,
                amount: i.amount.toString(),
                unit: i.unit,
                prepNote: i.prepNote || "",
                isScalable: i.isScalable !== 0,
              }))
            );
          }
          if (recipe.instructions.length > 0) {
            setInstructions(
              recipe.instructions.map((i) => ({
                id: i.id,
                text: i.text,
                timerMinutes: i.timerMinutes ? i.timerMinutes.toString() : "",
                temperature: i.temperature || "",
              }))
            );
          }
        }
      })();
    }
  }, [id]);

  const pickImage = async (useCamera: boolean) => {
    const launcher = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await launcher({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert("Recipe Photo", "Choose a source", [
      { text: "Camera", onPress: () => pickImage(true) },
      { text: "Photo Library", onPress: () => pickImage(false) },
      ...(imageUri ? [{ text: "Remove Photo", style: "destructive" as const, onPress: () => setImageUri("") }] : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const scanRecipe = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setScanning(true);
    try {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const ocrResponse = await fetch(`${API_BASE}/api/ocr-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!ocrResponse.ok) throw new Error("Failed to scan recipe");

      const data = await ocrResponse.json();
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
      if (data.baseServings) setServings(data.baseServings.toString());
      if (data.prepTime) setPrepTime(data.prepTime.toString());
      if (data.cookTime) setCookTime(data.cookTime.toString());
      if (data.notes) setNotes(data.notes);
      if (data.source) setSource(data.source);
      if (data.ingredients?.length > 0) {
        setIngredients(
          data.ingredients.map((ing: any) => ({
            id: Crypto.randomUUID(),
            name: ing.name || "",
            amount: (ing.amount || "").toString(),
            unit: ing.unit || "each",
            prepNote: ing.prepNote || "",
            isScalable: true,
          }))
        );
      }
      if (data.instructions?.length > 0) {
        setInstructions(
          data.instructions.map((inst: any) => ({
            id: Crypto.randomUUID(),
            text: inst.text || "",
            timerMinutes: inst.timerMinutes ? inst.timerMinutes.toString() : "",
            temperature: inst.temperature || "",
          }))
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Recipe Scanned", "Review the extracted data and make any corrections.");
    } catch (e) {
      Alert.alert("Scan Failed", "Could not extract recipe from image. Please try again with a clearer photo.");
    } finally {
      setScanning(false);
    }
  };

  const addTag = (text: string) => {
    const trimmed = text.replace(/,/g, "").trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addIngredient = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients((prev) => [
      ...prev,
      { id: Crypto.randomUUID(), name: "", amount: "", unit: "each", prepNote: "", isScalable: true },
    ]);
  };

  const removeIngredient = (ingId: string) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((i) => i.id !== ingId));
  };

  const updateIngredient = (ingId: string, field: keyof EditableIngredient, value: string | boolean) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === ingId ? { ...i, [field]: value } : i))
    );
  };

  const moveIngredient = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ingredients.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const addInstruction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInstructions((prev) => [
      ...prev,
      { id: Crypto.randomUUID(), text: "", timerMinutes: "", temperature: "" },
    ]);
  };

  const removeInstruction = (instId: string) => {
    if (instructions.length <= 1) return;
    setInstructions((prev) => prev.filter((i) => i.id !== instId));
  };

  const updateInstruction = (instId: string, field: keyof EditableInstruction, value: string) => {
    setInstructions((prev) =>
      prev.map((i) => (i.id === instId ? { ...i, [field]: value } : i))
    );
  };

  const moveInstruction = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= instructions.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInstructions((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!name.trim()) newErrors.name = "Recipe name is required";
    const validIngs = ingredients.filter((i) => i.name.trim());
    if (validIngs.length === 0) newErrors.ingredients = "At least one ingredient is required";
    const validInsts = instructions.filter((i) => i.text.trim());
    if (validInsts.length === 0) newErrors.instructions = "At least one instruction is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSaving(true);
    try {
      const validIngredients = ingredients.filter((i) => i.name.trim());
      const validInstructions = instructions.filter((i) => i.text.trim());

      const recipeId = id || Crypto.randomUUID();
      await saveRecipe({
        id: recipeId,
        name: name.trim(),
        description: description.trim(),
        category,
        tags: JSON.stringify(tags),
        baseServings: parseInt(servings) || 4,
        baseYieldUnit: yieldUnit.trim() || "servings",
        prepTime: parseInt(prepTime) || 0,
        cookTime: parseInt(cookTime) || 0,
        imageUri: imageUri,
        notes: notes.trim(),
        source: source.trim(),
        isFavorite: 0,
        ingredients: validIngredients.map((ing, idx) => ({
          id: ing.id,
          recipeId,
          name: ing.name.trim(),
          amount: parseFloat(ing.amount) || 0,
          unit: ing.unit,
          category: "",
          costPerUnit: null,
          costUnit: null,
          fdcId: null,
          isOptional: 0,
          isScalable: ing.isScalable ? 1 : 0,
          prepNote: ing.prepNote.trim(),
          sortOrder: idx,
        })),
        instructions: validInstructions.map((inst, idx) => ({
          id: inst.id,
          recipeId,
          stepNumber: idx + 1,
          text: inst.text.trim(),
          timerMinutes: inst.timerMinutes ? parseInt(inst.timerMinutes) : null,
          temperature: inst.temperature.trim(),
          sortOrder: idx,
        })),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (isEditing) {
        router.back();
      } else {
        router.replace({ pathname: "/recipe/[id]", params: { id: recipeId } });
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.topBarButton} testID="close-btn">
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>
          {isEditing ? "Edit Recipe" : "New Recipe"}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.7 }]}
          testID="save-top-btn"
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.textPrimary} />
          ) : (
            <Ionicons name="checkmark" size={24} color={Colors.textPrimary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* PHOTO SECTION */}
        <Pressable onPress={showImageOptions} style={styles.photoArea} testID="photo-area">
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
            </View>
          )}
        </Pressable>

        {/* SCAN RECIPE BUTTON */}
        <Pressable
          onPress={scanRecipe}
          disabled={scanning}
          style={({ pressed }) => [styles.scanButton, pressed && { opacity: 0.7 }]}
          testID="scan-recipe-btn"
        >
          {scanning ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <Ionicons name="scan-outline" size={20} color={Colors.accent} />
          )}
          <Text style={styles.scanButtonText}>
            {scanning ? "Scanning recipe..." : "Scan written recipe"}
          </Text>
        </Pressable>

        {/* BASIC INFO */}
        <Text style={styles.inputLabel}>Recipe Name *</Text>
        <TextInput
          style={[styles.input, styles.nameInput, errors.name ? styles.inputError : null]}
          value={name}
          onChangeText={(v) => { setName(v); if (errors.name) setErrors({ ...errors, name: undefined }); }}
          placeholder="e.g. Classic Béchamel Sauce"
          placeholderTextColor={Colors.textMuted}
          testID="recipe-name-input"
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Brief description..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          testID="description-input"
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

        {/* TAGS */}
        <Text style={styles.inputLabel}>Tags</Text>
        <View style={styles.tagContainer}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
              <Pressable onPress={() => removeTag(tag)} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
              </Pressable>
            </View>
          ))}
          <TextInput
            style={styles.tagInput}
            value={tagInput}
            onChangeText={(v) => {
              if (v.includes(",")) {
                addTag(v);
              } else {
                setTagInput(v);
              }
            }}
            onSubmitEditing={() => addTag(tagInput)}
            placeholder={tags.length === 0 ? "Type tag, press enter" : ""}
            placeholderTextColor={Colors.textMuted}
            returnKeyType="done"
          />
        </View>

        <View style={styles.rowFields}>
          <View style={styles.fieldHalf}>
            <Text style={styles.inputLabel}>Servings</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServings}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor={Colors.textMuted}
              testID="servings-input"
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.inputLabel}>Yield Unit</Text>
            <TextInput
              style={styles.input}
              value={yieldUnit}
              onChangeText={setYieldUnit}
              placeholder="servings"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.rowFields}>
          <View style={styles.fieldHalf}>
            <Text style={styles.inputLabel}>Prep (min)</Text>
            <TextInput
              style={styles.input}
              value={prepTime}
              onChangeText={setPrepTime}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              testID="prep-time-input"
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.inputLabel}>Cook (min)</Text>
            <TextInput
              style={styles.input}
              value={cookTime}
              onChangeText={setCookTime}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              testID="cook-time-input"
            />
          </View>
        </View>

        {/* INGREDIENTS */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionLabel}>Ingredients *</Text>
          <Pressable onPress={addIngredient} style={styles.addButton} testID="add-ingredient-btn">
            <Ionicons name="add" size={18} color={Colors.textPrimary} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
        {errors.ingredients ? <Text style={styles.errorText}>{errors.ingredients}</Text> : null}

        {ingredients.map((ing, idx) => (
          <View key={ing.id} style={styles.ingredientCard}>
            <View style={styles.ingredientCardHeader}>
              <View style={styles.reorderButtons}>
                <Pressable
                  onPress={() => moveIngredient(idx, -1)}
                  disabled={idx === 0}
                  style={[styles.reorderBtn, idx === 0 && styles.reorderBtnDisabled]}
                >
                  <Ionicons name="chevron-up" size={16} color={idx === 0 ? Colors.textMuted : Colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => moveIngredient(idx, 1)}
                  disabled={idx === ingredients.length - 1}
                  style={[styles.reorderBtn, idx === ingredients.length - 1 && styles.reorderBtnDisabled]}
                >
                  <Ionicons name="chevron-down" size={16} color={idx === ingredients.length - 1 ? Colors.textMuted : Colors.textSecondary} />
                </Pressable>
              </View>
              {ingredients.length > 1 ? (
                <Pressable onPress={() => removeIngredient(ing.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={Colors.error} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.amountUnitRow}>
              <TextInput
                style={[styles.input, styles.amountInput]}
                value={ing.amount}
                onChangeText={(v) => updateIngredient(ing.id, "amount", v)}
                placeholder="Qty"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
              <Pressable
                onPress={() => setUnitPickerVisible(ing.id)}
                style={styles.unitSelector}
              >
                <Text style={styles.unitSelectorText}>
                  {UNITS[ing.unit]?.abbreviation || ing.unit}
                </Text>
                <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
              </Pressable>
              <TextInput
                style={[styles.input, styles.ingredientNameInput]}
                value={ing.name}
                onChangeText={(v) => updateIngredient(ing.id, "name", v)}
                placeholder="Ingredient name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.ingredientExtras}>
              <TextInput
                style={[styles.input, styles.prepNoteInput]}
                value={ing.prepNote}
                onChangeText={(v) => updateIngredient(ing.id, "prepNote", v)}
                placeholder="diced, minced, etc."
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.scalableToggle}>
                <Text style={styles.scalableLabel}>Non-scalable</Text>
                <Switch
                  value={!ing.isScalable}
                  onValueChange={(v) => updateIngredient(ing.id, "isScalable", !v)}
                  trackColor={{ false: Colors.border, true: Colors.accent }}
                  thumbColor={Colors.textPrimary}
                />
              </View>
            </View>
          </View>
        ))}

        <Pressable onPress={addIngredient} style={styles.addRowButton}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addRowText}>Add Ingredient</Text>
        </Pressable>

        {/* INSTRUCTIONS */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionLabel}>Instructions *</Text>
          <Pressable onPress={addInstruction} style={styles.addButton} testID="add-step-btn">
            <Ionicons name="add" size={18} color={Colors.textPrimary} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
        {errors.instructions ? <Text style={styles.errorText}>{errors.instructions}</Text> : null}

        {instructions.map((inst, idx) => (
          <View key={inst.id} style={styles.instructionCard}>
            <View style={styles.instructionCardHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{idx + 1}</Text>
              </View>
              <View style={styles.reorderButtons}>
                <Pressable
                  onPress={() => moveInstruction(idx, -1)}
                  disabled={idx === 0}
                  style={[styles.reorderBtn, idx === 0 && styles.reorderBtnDisabled]}
                >
                  <Ionicons name="chevron-up" size={16} color={idx === 0 ? Colors.textMuted : Colors.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => moveInstruction(idx, 1)}
                  disabled={idx === instructions.length - 1}
                  style={[styles.reorderBtn, idx === instructions.length - 1 && styles.reorderBtnDisabled]}
                >
                  <Ionicons name="chevron-down" size={16} color={idx === instructions.length - 1 ? Colors.textMuted : Colors.textSecondary} />
                </Pressable>
              </View>
              {instructions.length > 1 ? (
                <Pressable onPress={() => removeInstruction(inst.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={Colors.error} />
                </Pressable>
              ) : null}
            </View>

            <TextInput
              style={[styles.input, styles.instructionTextInput]}
              value={inst.text}
              onChangeText={(v) => updateInstruction(inst.id, "text", v)}
              placeholder={`Step ${idx + 1} instructions...`}
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            <View style={styles.instructionMeta}>
              <View style={styles.instructionMetaField}>
                <Ionicons name="timer-outline" size={16} color={Colors.primary} />
                <TextInput
                  style={[styles.input, styles.metaInput]}
                  value={inst.timerMinutes}
                  onChangeText={(v) => updateInstruction(inst.id, "timerMinutes", v)}
                  placeholder="min"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.instructionMetaField}>
                <Ionicons name="thermometer-outline" size={16} color={Colors.accent} />
                <TextInput
                  style={[styles.input, styles.metaInput]}
                  value={inst.temperature}
                  onChangeText={(v) => updateInstruction(inst.id, "temperature", v)}
                  placeholder="350°F"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </View>
        ))}

        <Pressable onPress={addInstruction} style={styles.addRowButton}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addRowText}>Add Step</Text>
        </Pressable>

        {/* NOTES SECTION */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl, marginBottom: Spacing.md }]}>
          Chef's Notes
        </Text>
        <TextInput
          style={[styles.input, styles.multiline, { minHeight: 100 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Tips, variations, origin story..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={5}
          testID="notes-input"
        />

        <Text style={styles.inputLabel}>Source</Text>
        <TextInput
          style={styles.input}
          value={source}
          onChangeText={setSource}
          placeholder="Where this recipe came from"
          placeholderTextColor={Colors.textMuted}
          testID="source-input"
        />

        {/* SAVE BUTTON */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.mainSaveButton, pressed && { opacity: 0.8 }]}
          testID="save-recipe-btn"
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.textPrimary} />
          ) : (
            <Text style={styles.mainSaveButtonText}>
              {isEditing ? "Update Recipe" : "Save Recipe"}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.cancelButton} testID="cancel-btn">
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </ScrollView>

      {/* UNIT PICKER MODAL */}
      <Modal
        visible={unitPickerVisible !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setUnitPickerVisible(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setUnitPickerVisible(null)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Unit</Text>
            <ScrollView style={styles.unitList} showsVerticalScrollIndicator={false}>
              {COMMON_UNITS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => {
                    if (unitPickerVisible) {
                      updateIngredient(unitPickerVisible, "unit", u);
                    }
                    setUnitPickerVisible(null);
                  }}
                  style={({ pressed }) => [
                    styles.unitOption,
                    unitPickerVisible && ingredients.find((i) => i.id === unitPickerVisible)?.unit === u && styles.unitOptionActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.unitOptionAbbr}>{UNITS[u]?.abbreviation || u}</Text>
                  <Text style={styles.unitOptionName}>{UNITS[u]?.name || u}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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

  photoArea: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginBottom: Spacing.md,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  photoPlaceholderText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginBottom: Spacing.lg,
  },
  scanButtonText: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
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
  nameInput: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  inputError: {
    borderColor: Colors.error,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontFamily: "Inter_400Regular",
    marginTop: Spacing.xs,
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

  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
    minHeight: TouchTarget.min,
    alignItems: "center",
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.backgroundElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagChipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
  },
  tagInput: {
    flex: 1,
    minWidth: 80,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    padding: 4,
  },

  rowFields: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },

  ingredientCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  ingredientCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  reorderButtons: {
    flexDirection: "row",
    gap: 2,
  },
  reorderBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundDark,
  },
  reorderBtnDisabled: {
    opacity: 0.4,
  },
  amountUnitRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  amountInput: {
    width: 60,
    textAlign: "center",
  },
  unitSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minHeight: TouchTarget.min,
    minWidth: 64,
    justifyContent: "center",
  },
  unitSelectorText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  ingredientNameInput: {
    flex: 1,
  },
  ingredientExtras: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  prepNoteInput: {
    flex: 1,
    minHeight: 38,
  },
  scalableToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  scalableLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },

  addRowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  addRowText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },

  instructionCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  instructionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  instructionTextInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  instructionMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  instructionMetaField: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  metaInput: {
    flex: 1,
    minHeight: 38,
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
  cancelButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontFamily: "Inter_600SemiBold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "60%",
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  unitList: {
    paddingHorizontal: Spacing.lg,
  },
  unitOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  unitOptionActive: {
    backgroundColor: Colors.backgroundElevated,
  },
  unitOptionAbbr: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    width: 50,
  },
  unitOptionName: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
});
