import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { COMMON_UNITS, UNITS } from "@/constants/units";
import type { IngredientPriceRow } from "@/lib/database";

type SortMode = "alpha" | "recent";

function parsePurchaseUnit(raw: string): { quantity: number; unitKey: string } | null {
  const trimmed = raw.trim().toLowerCase();
  const match = trimmed.match(/^([\d.]+)\s*(.+)$/);
  if (!match) return null;
  const quantity = parseFloat(match[1]);
  if (isNaN(quantity) || quantity <= 0) return null;
  const unitStr = match[2].trim();
  const directKey = Object.keys(UNITS).find(
    (k) =>
      k.toLowerCase() === unitStr ||
      UNITS[k].abbreviation.toLowerCase() === unitStr ||
      UNITS[k].name.toLowerCase() === unitStr ||
      UNITS[k].name.toLowerCase() + "s" === unitStr
  );
  if (directKey) return { quantity, unitKey: directKey };
  const bagMatch = unitStr.match(/^([\w]+)\s*(bag|box|container|pack|jar|can|bottle)$/);
  if (bagMatch) {
    const innerUnit = bagMatch[1];
    const found = Object.keys(UNITS).find(
      (k) =>
        k.toLowerCase() === innerUnit ||
        UNITS[k].abbreviation.toLowerCase() === innerUnit ||
        UNITS[k].name.toLowerCase() === innerUnit ||
        UNITS[k].name.toLowerCase() + "s" === innerUnit
    );
    if (found) return { quantity, unitKey: found };
  }
  return null;
}

function tryAutoCalculate(
  purchaseCostStr: string,
  purchaseUnitStr: string,
  costUnitKey: string
): { costPerUnit: number; wasCalculated: boolean } | null {
  const cost = parseFloat(purchaseCostStr);
  if (isNaN(cost) || cost <= 0) return null;
  const parsed = parsePurchaseUnit(purchaseUnitStr);
  if (!parsed) return null;
  const purchaseDef = UNITS[parsed.unitKey];
  const costDef = UNITS[costUnitKey];
  if (!purchaseDef || !costDef) return null;
  if (purchaseDef.baseName !== costDef.baseName) return null;
  const totalBase = parsed.quantity * purchaseDef.toBase;
  const costUnitBase = costDef.toBase;
  const unitsCount = totalBase / costUnitBase;
  if (unitsCount <= 0) return null;
  const perUnit = cost / unitsCount;
  return { costPerUnit: Math.round(perUnit * 100) / 100, wasCalculated: true };
}

export default function PricesScreen() {
  const insets = useSafeAreaInsets();
  const { prices, loadPrices, savePrice, removePrice } = useRecipeStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<IngredientPriceRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("alpha");

  const [name, setName] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [costUnit, setCostUnit] = useState("lb");
  const [purchaseUnit, setPurchaseUnit] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [wasAutoCalculated, setWasAutoCalculated] = useState(false);

  useEffect(() => {
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPrices = useMemo(() => {
    let result = prices;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.ingredientName.toLowerCase().includes(q));
    }
    if (sortMode === "alpha") {
      result = [...result].sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
    } else {
      result = [...result].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    }
    return result;
  }, [prices, searchQuery, sortMode]);

  const stats = useMemo(() => {
    const totalIngredients = prices.length;
    let totalValue = 0;
    for (const p of prices) {
      if (p.purchaseCost != null) {
        totalValue += p.purchaseCost;
      } else if (p.costPerUnit != null) {
        totalValue += p.costPerUnit;
      }
    }
    return { totalIngredients, totalValue };
  }, [prices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  }, [loadPrices]);

  const resetForm = () => {
    setName("");
    setCostPerUnit("");
    setCostUnit("lb");
    setPurchaseUnit("");
    setPurchaseCost("");
    setEditingPrice(null);
    setWasAutoCalculated(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: IngredientPriceRow) => {
    setEditingPrice(item);
    setName(item.ingredientName);
    setCostPerUnit(item.costPerUnit != null ? item.costPerUnit.toString() : "");
    setCostUnit(item.costUnit || "lb");
    setPurchaseUnit(item.purchaseUnit || "");
    setPurchaseCost(item.purchaseCost != null ? item.purchaseCost.toString() : "");
    setWasAutoCalculated(false);
    setShowAddModal(true);
  };

  const attemptAutoCalc = useCallback(
    (pCost: string, pUnit: string, cUnit: string) => {
      const result = tryAutoCalculate(pCost, pUnit, cUnit);
      if (result) {
        setCostPerUnit(result.costPerUnit.toFixed(2));
        setWasAutoCalculated(true);
      } else {
        setWasAutoCalculated(false);
      }
    },
    []
  );

  const handlePurchaseCostChange = (val: string) => {
    setPurchaseCost(val);
    attemptAutoCalc(val, purchaseUnit, costUnit);
  };

  const handlePurchaseUnitChange = (val: string) => {
    setPurchaseUnit(val);
    attemptAutoCalc(purchaseCost, val, costUnit);
  };

  const handleCostUnitChange = (unit: string) => {
    setCostUnit(unit);
    attemptAutoCalc(purchaseCost, purchaseUnit, unit);
  };

  const handleCostPerUnitManualChange = (val: string) => {
    setCostPerUnit(val);
    setWasAutoCalculated(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !costPerUnit.trim()) {
      Alert.alert("Missing Info", "Please enter ingredient name and cost per unit.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await savePrice({
      id: editingPrice?.id || Crypto.randomUUID(),
      ingredientName: name.trim(),
      costPerUnit: parseFloat(costPerUnit) || 0,
      costUnit: costUnit,
      purchaseUnit: purchaseUnit.trim(),
      purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
    });
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (item: IngredientPriceRow) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Price",
      `Remove price for "${item.ingredientName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removePrice(item.id) },
      ]
    );
  };

  const toggleSort = () => {
    Haptics.selectionAsync();
    setSortMode((prev) => (prev === "alpha" ? "recent" : "alpha"));
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Prices</Text>
        </View>
        <Pressable
          onPress={openAddModal}
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {prices.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalIngredients}</Text>
            <Text style={styles.statLabel}>Tracked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.totalValue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Est. Value</Text>
          </View>
        </View>
      )}

      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search ingredients..."
            placeholderTextColor={Colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={toggleSort}
          style={({ pressed }) => [styles.sortButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons
            name={sortMode === "alpha" ? "text" : "time"}
            size={18}
            color={Colors.textPrimary}
          />
        </Pressable>
      </View>

      <FlatList
        data={filteredPrices}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!filteredPrices.length}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={[
          styles.list,
          filteredPrices.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEditModal(item)}
            onLongPress={() => handleDelete(item)}
            style={({ pressed }) => [styles.priceCard, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.priceInfo}>
              <Text style={styles.priceName}>{item.ingredientName}</Text>
              <Text style={styles.priceDetail}>
                per {UNITS[item.costUnit]?.abbreviation || item.costUnit || "unit"}
              </Text>
              {item.purchaseCost != null && item.purchaseUnit ? (
                <Text style={styles.priceStore}>
                  ${item.purchaseCost.toFixed(2)} / {item.purchaseUnit}
                </Text>
              ) : null}
            </View>
            <View style={styles.unitPriceContainer}>
              <Text style={styles.unitPrice}>
                ${(item.costPerUnit ?? 0).toFixed(2)}
              </Text>
              <Text style={styles.unitPriceLabel}>
                per {UNITS[item.costUnit]?.abbreviation || item.costUnit || "unit"}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <LinearGradient
            colors={['#0F1115', '#1A1008', '#0F1115']}
            style={styles.emptyContainer}
          >
            <Ionicons name="pricetag-outline" size={80} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matches found" : "Start tracking prices"}
            </Text>
            <Text style={styles.emptySubtitle}>Track ingredient costs to know your margins</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No ingredients match "${searchQuery}". Try a different search.`
                : "Tap the + button to add your first ingredient price. Track costs to see real-time estimates on your recipes."}
            </Text>
            {!searchQuery && (
              <>
                <Pressable
                  onPress={openAddModal}
                  style={({ pressed }) => [styles.emptyAddButton, pressed && { opacity: 0.8 }]}
                >
                  <Ionicons name="add" size={20} color={Colors.textPrimary} />
                  <Text style={styles.emptyAddText}>Add First Price</Text>
                </Pressable>
                <Text style={styles.emptyHint}>Long press any item to delete it</Text>
              </>
            )}
          </LinearGradient>
        }
      />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPrice ? "Edit Price" : "Add Price"}
              </Text>
              <Pressable onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Ingredient Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. All-purpose flour"
                placeholderTextColor={Colors.textMuted}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Cost per Unit ($)</Text>
                    {wasAutoCalculated && (
                      <View style={styles.calcBadge}>
                        <Ionicons name="calculator-outline" size={10} color={Colors.primary} />
                        <Text style={styles.calcBadgeText}>calculated</Text>
                      </View>
                    )}
                  </View>
                  <TextInput
                    style={[styles.input, wasAutoCalculated && styles.inputCalculated]}
                    value={costPerUnit}
                    onChangeText={handleCostPerUnitManualChange}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Cost Unit</Text>
                  <View style={styles.unitDisplay}>
                    <Text style={styles.unitDisplayText}>
                      {UNITS[costUnit]?.abbreviation || costUnit}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.unitGrid}>
                {COMMON_UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => handleCostUnitChange(u)}
                    style={[styles.unitChip, costUnit === u && styles.unitChipActive]}
                  >
                    <Text style={[styles.unitChipText, costUnit === u && styles.unitChipTextActive]}>
                      {UNITS[u]?.abbreviation || u}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.autoCalcSection}>
                <View style={styles.autoCalcHeader}>
                  <Ionicons name="flash-outline" size={16} color={Colors.accent} />
                  <Text style={styles.autoCalcTitle}>Auto-Calculate from Purchase</Text>
                </View>
                <Text style={styles.autoCalcHint}>
                  Enter cost and unit (e.g. &quot;5lb bag&quot;) to auto-fill cost per unit
                </Text>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Purchase Cost ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={purchaseCost}
                    onChangeText={handlePurchaseCostChange}
                    placeholder="e.g. 5.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Purchase Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={purchaseUnit}
                    onChangeText={handlePurchaseUnitChange}
                    placeholder="e.g. 5lb bag"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.saveButtonText}>
                  {editingPrice ? "Update Price" : "Save Price"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    fontFamily: "DMSans_700Bold",
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D97706',
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: "center",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: "700" as const,
    color: Colors.accent,
    fontFamily: "DMSans_700Bold",
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: Spacing.md,
    minHeight: TouchTarget.min,
  },
  searchContainerFocused: {
    borderColor: 'rgba(255,255,255,0.20)',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "DMSans_400Regular",
    paddingVertical: Spacing.sm,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  priceCard: {
    flexDirection: "row",
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: "center",
  },
  priceInfo: {
    flex: 1,
  },
  priceName: {
    fontSize: FontSize.lg,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    fontFamily: "DMSans_600SemiBold",
  },
  priceDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  priceStore: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  unitPriceContainer: {
    alignItems: "flex-end",
  },
  unitPrice: {
    fontSize: FontSize.xl,
    fontWeight: "700" as const,
    color: Colors.accent,
    fontFamily: "DMSans_700Bold",
  },
  unitPriceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: "DMSans_400Regular",
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
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    fontFamily: "DMSans_600SemiBold",
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
    fontStyle: "italic" as const,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
    paddingHorizontal: Spacing.xxxl,
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  emptyAddText: {
    fontSize: FontSize.md,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    fontFamily: "DMSans_600SemiBold",
  },
  emptyHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: "DMSans_400Regular",
    marginTop: Spacing.sm,
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
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    fontFamily: "DMSans_700Bold",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "DMSans_400Regular",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchTarget.min,
  },
  inputCalculated: {
    borderColor: Colors.primary,
  },
  calcBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  calcBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: "DMSans_600SemiBold",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  unitDisplay: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchTarget.min,
    justifyContent: "center",
  },
  unitDisplayText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "DMSans_400Regular",
  },
  unitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  unitChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "DMSans_600SemiBold",
  },
  unitChipTextActive: {
    color: Colors.textPrimary,
  },
  autoCalcSection: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  autoCalcHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  autoCalcTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600" as const,
    color: Colors.accent,
    fontFamily: "DMSans_600SemiBold",
  },
  autoCalcHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: "DMSans_400Regular",
    marginTop: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.xl,
    minHeight: TouchTarget.min,
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: FontSize.lg,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    fontFamily: "DMSans_700Bold",
  },
});
