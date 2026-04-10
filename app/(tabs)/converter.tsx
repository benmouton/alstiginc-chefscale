import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from "@/constants/theme";
import { UNITS, UNIT_CATEGORIES, type UnitCategory } from "@/constants/units";
import { convertUnit, formatQuantity, getUnitAbbreviation } from "@/lib/scaling";

const DISPLAY_CATEGORIES: { label: string; value: UnitCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Volume", value: "volume" },
  { label: "Weight", value: "weight" },
  { label: "Count", value: "count" },
];

const PRESETS = [
  { label: '1 cup', from: 'cup', to: 'ml', value: '1' },
  { label: '1 lb', from: 'lb', to: 'g', value: '1' },
  { label: '1 oz', from: 'oz', to: 'g', value: '1' },
  { label: '1 cup→tbsp', from: 'cup', to: 'tbsp', value: '1' },
];

export default function ConverterScreen() {
  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState("1");
  const [fromUnit, setFromUnit] = useState("cup");
  const [toUnit, setToUnit] = useState("tbsp");
  const [selectedCategory, setSelectedCategory] = useState<UnitCategory | "all">("all");
  const [activePickerField, setActivePickerField] = useState<"from" | "to" | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const filteredUnits = useMemo(() => {
    if (selectedCategory === "all") {
      return Object.keys(UNITS).filter(
        (key) =>
          UNITS[key].category === "volume" ||
          UNITS[key].category === "weight" ||
          UNITS[key].category === "count"
      );
    }
    return UNIT_CATEGORIES[selectedCategory] || [];
  }, [selectedCategory]);

  const numericValue = useMemo(() => {
    const parsed = parseFloat(inputValue);
    return isNaN(parsed) ? 0 : parsed;
  }, [inputValue]);

  const result = useMemo(() => {
    if (numericValue <= 0) return null;
    return convertUnit(numericValue, fromUnit, toUnit);
  }, [numericValue, fromUnit, toUnit]);

  const canConvert = useMemo(() => {
    const from = UNITS[fromUnit];
    const to = UNITS[toUnit];
    if (!from || !to) return false;
    return from.category === to.category && from.baseName === to.baseName;
  }, [fromUnit, toUnit]);

  const handleSwap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const handleSelectUnit = (unitKey: string) => {
    Haptics.selectionAsync();
    if (activePickerField === "from") {
      setFromUnit(unitKey);
    } else if (activePickerField === "to") {
      setToUnit(unitKey);
    }
    setActivePickerField(null);
  };

  const handlePreset = (preset: typeof PRESETS[number]) => {
    Haptics.selectionAsync();
    setFromUnit(preset.from);
    setToUnit(preset.to);
    setInputValue(preset.value);
  };

  const renderResultText = () => {
    if (numericValue <= 0) {
      return <Text style={styles.resultPlaceholder}>Enter a value</Text>;
    }
    if (!canConvert) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
          <Text style={styles.errorText}>Cannot convert between different categories</Text>
        </View>
      );
    }
    if (result !== null) {
      return (
        <Text style={styles.resultValue}>
          {formatQuantity(result)} {getUnitAbbreviation(toUnit)}
        </Text>
      );
    }
    return null;
  };

  const renderUnitPicker = () => {
    if (!activePickerField) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>
            Select {activePickerField === "from" ? '"From"' : '"To"'} unit
          </Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActivePickerField(null);
            }}
            style={({ pressed }) => [styles.pickerClose, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <FlatList
          data={filteredUnits}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.pickerList}
          renderItem={({ item }) => {
            const unit = UNITS[item];
            const isSelected =
              (activePickerField === "from" && item === fromUnit) ||
              (activePickerField === "to" && item === toUnit);
            return (
              <Pressable
                onPress={() => handleSelectUnit(item)}
                style={({ pressed }) => [
                  styles.pickerItem,
                  isSelected && styles.pickerItemSelected,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.pickerItemName,
                    isSelected && styles.pickerItemNameSelected,
                  ]}
                >
                  {unit.name}
                </Text>
                <Text
                  style={[
                    styles.pickerItemAbbr,
                    isSelected && styles.pickerItemAbbrSelected,
                  ]}
                >
                  {unit.abbreviation}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Convert</Text>
          <Text style={styles.subtitle}>Quick unit reference</Text>
        </View>
      </View>

      {/* Category filter */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={DISPLAY_CATEGORIES}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = item.value === selectedCategory;
            return (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(item.value);
                }}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {activePickerField ? (
        renderUnitPicker()
      ) : (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentInner}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick presets */}
          <View style={styles.presetsRow}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset.label}
                onPress={() => handlePreset(preset)}
                style={({ pressed }) => [
                  styles.presetPill,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.presetLabel}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Input section */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              selectTextOnFocus
            />
          </View>

          {/* From unit */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActivePickerField("from");
            }}
            style={({ pressed }) => [styles.card, styles.unitSelector, pressed && { opacity: 0.7 }]}
          >
            <View>
              <Text style={styles.cardLabel}>From</Text>
              <Text style={styles.unitName}>{UNITS[fromUnit]?.name}</Text>
            </View>
            <View style={styles.unitRight}>
              <Text style={styles.unitAbbr}>{getUnitAbbreviation(fromUnit)}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          </Pressable>

          {/* Swap button */}
          <View style={styles.swapContainer}>
            <Pressable
              onPress={handleSwap}
              style={({ pressed }) => [styles.swapButton, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="swap-vertical" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* To unit */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setActivePickerField("to");
            }}
            style={({ pressed }) => [styles.card, styles.unitSelector, pressed && { opacity: 0.7 }]}
          >
            <View>
              <Text style={styles.cardLabel}>To</Text>
              <Text style={styles.unitName}>{UNITS[toUnit]?.name}</Text>
            </View>
            <View style={styles.unitRight}>
              <Text style={styles.unitAbbr}>{getUnitAbbreviation(toUnit)}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          </Pressable>

          {/* Result */}
          <View style={[styles.card, styles.resultCard]}>
            <Text style={styles.cardLabel}>Result</Text>
            {renderResultText()}
          </View>
        </ScrollView>
      )}
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  categoryChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  categoryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  categoryTextActive: {
    color: Colors.textPrimary,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  presetPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  presetLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: Spacing.lg,
  },
  cardLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: FontSize.display,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    padding: 0,
    minHeight: TouchTarget.min,
  },
  unitSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitName: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  unitRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unitAbbr: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  swapContainer: {
    alignItems: "center",
    marginVertical: -Spacing.xs,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D97706',
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  resultCard: {
    marginTop: Spacing.sm,
  },
  resultValue: {
    fontSize: 42,
    fontWeight: "700",
    color: '#D97706',
    fontFamily: "Inter_700Bold",
    textShadowColor: '#D97706',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  resultPlaceholder: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontFamily: "Inter_400Regular",
  },
  // Picker styles
  pickerOverlay: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  pickerTitle: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  pickerClose: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.sm,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
  },
  pickerItemSelected: {
    backgroundColor: '#D97706' + '20',
    borderColor: '#D97706',
  },
  pickerItemName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  pickerItemNameSelected: {
    color: Colors.primaryLight,
  },
  pickerItemAbbr: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  pickerItemAbbrSelected: {
    color: Colors.primaryLight,
  },
});
