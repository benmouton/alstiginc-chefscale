import React, { useEffect, useState, useCallback } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { COMMON_UNITS, UNITS } from "@/constants/units";
import type { IngredientPriceRow } from "@/lib/database";

export default function PricesScreen() {
  const insets = useSafeAreaInsets();
  const { prices, loadPrices, savePrice, removePrice } = useRecipeStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<IngredientPriceRow | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [costUnit, setCostUnit] = useState("lb");
  const [purchaseUnit, setPurchaseUnit] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");

  useEffect(() => {
    loadPrices();
  }, []);

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
    setShowAddModal(true);
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

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Prices</Text>
          <Text style={styles.subtitle}>{prices.length} ingredients tracked</Text>
        </View>
        <Pressable
          onPress={openAddModal}
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={prices}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!prices.length}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={[
          styles.list,
          prices.length === 0 && styles.listEmpty,
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
                per {UNITS[item.costUnit]?.abbreviation || item.costUnit || 'unit'}
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
                per {UNITS[item.costUnit]?.abbreviation || item.costUnit || 'unit'}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No prices yet</Text>
            <Text style={styles.emptyText}>
              Add ingredient prices to see cost estimates on your recipes
            </Text>
          </View>
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
                  <Text style={styles.inputLabel}>Cost per Unit ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={costPerUnit}
                    onChangeText={setCostPerUnit}
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
                    onPress={() => setCostUnit(u)}
                    style={[styles.unitChip, costUnit === u && styles.unitChipActive]}
                  >
                    <Text style={[styles.unitChipText, costUnit === u && styles.unitChipTextActive]}>
                      {UNITS[u]?.abbreviation || u}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Purchase Cost ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={purchaseCost}
                    onChangeText={setPurchaseCost}
                    placeholder="Optional"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Purchase Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={purchaseUnit}
                    onChangeText={setPurchaseUnit}
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
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  priceInfo: {
    flex: 1,
  },
  priceName: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  priceDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  priceStore: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  unitPriceContainer: {
    alignItems: "flex-end",
  },
  unitPrice: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.accent,
    fontFamily: "Inter_700Bold",
  },
  unitPriceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
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
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  inputLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchTarget.min,
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
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_600SemiBold",
  },
  unitChipTextActive: {
    color: Colors.textPrimary,
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
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
});
