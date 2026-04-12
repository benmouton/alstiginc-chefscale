import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget, MONO_FONT } from '@/constants/theme';
import { UnitPicker } from './UnitPicker';
import { suggestUnitsForIngredient } from '@/lib/ingredientUnitHints';
import { buildCostSentence } from '@/lib/priceSentence';
import { parsePriceDescription } from '@/lib/priceParse';

export interface PriceEditorValues {
  purchaseCost: string;   // dollars — string for controlled input
  amount: string;         // total amount in `unit`
  unit: string;           // base unit like "lb"
  container: string;      // optional freetext descriptor
}

interface PriceEditorSheetProps {
  visible: boolean;
  ingredientName: string;
  initial: PriceEditorValues;
  /** Called when the user hits Save with valid inputs. Receives the raw
   *  form values plus the derived costPerUnit for storage. */
  onSave: (values: PriceEditorValues & { costPerUnit: number }) => void;
  onClose: () => void;
  /** API base URL for the natural-language parser. Pass empty string on web. */
  apiBase?: string;
}

/**
 * Bottom sheet for entering ingredient purchase cost. Two ways in:
 *   1. "Describe your purchase" text input + ✨ Parse button → AI fills fields
 *   2. Manual: $ amount for [quantity] [unit] + optional descriptor
 *
 * Live two-line sentence preview at the bottom confirms the user's math
 * before they hit Save.
 */
export function PriceEditorSheet({
  visible,
  ingredientName,
  initial,
  onSave,
  onClose,
  apiBase = '',
}: PriceEditorSheetProps) {
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState('');
  const [purchaseCost, setPurchaseCost] = useState(initial.purchaseCost);
  const [amount, setAmount] = useState(initial.amount);
  const [unit, setUnit] = useState(initial.unit);
  const [container, setContainer] = useState(initial.container);
  const [parsing, setParsing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Reset fields whenever the sheet re-opens with new initial values.
  useEffect(() => {
    if (visible) {
      setDescription('');
      setPurchaseCost(initial.purchaseCost);
      setAmount(initial.amount);
      setUnit(initial.unit || '');
      setContainer(initial.container);
    } else {
      // Cancel any in-flight parse when the sheet closes
      abortRef.current?.abort();
      abortRef.current = null;
      setParsing(false);
    }
  }, [visible, initial]);

  const hint = useMemo(() => suggestUnitsForIngredient(ingredientName), [ingredientName]);
  const suggestions = useMemo(
    () => [hint.primary, ...hint.alternates],
    [hint]
  );

  // Auto-seed the unit picker with the ingredient's suggested primary
  // when the sheet opens with no prior unit set.
  useEffect(() => {
    if (visible && !initial.unit && !unit) {
      setUnit(hint.primary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const preview = useMemo(() => {
    return buildCostSentence({
      purchaseCost: parseFloat(purchaseCost),
      amount: parseFloat(amount),
      unit,
      container: container || undefined,
    });
  }, [purchaseCost, amount, unit, container]);

  const canSave = preview.costPerUnit !== null;

  const handleParse = async () => {
    if (!description.trim() || parsing) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setParsing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await parsePriceDescription(description, {
      apiBase,
      ingredientName,
      signal: controller.signal,
    });

    setParsing(false);
    abortRef.current = null;

    if (!result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Could not parse',
        'Try being more specific — include the dollar amount, quantity, and unit. Or fill the fields manually below.'
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPurchaseCost(String(result.purchaseCost));
    setAmount(String(result.amount));
    setUnit(result.unit);
    if (result.container) setContainer(result.container);
  };

  const handleSave = () => {
    if (preview.costPerUnit === null) {
      Alert.alert('Missing info', 'Enter a purchase cost, amount, and unit to continue.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      purchaseCost,
      amount,
      unit,
      container,
      costPerUnit: preview.costPerUnit,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerLabel}>Purchase cost</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {ingredientName || 'Ingredient'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Natural-language parse */}
            <Text style={styles.sectionLabel}>Describe it</Text>
            <View style={styles.parseRow}>
              <TextInput
                style={styles.parseInput}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. $30 for a 50 lb sack"
                placeholderTextColor={Colors.textMuted}
                multiline
                onSubmitEditing={handleParse}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleParse}
                disabled={!description.trim() || parsing}
                style={({ pressed }) => [
                  styles.parseButton,
                  (!description.trim() || parsing) && styles.parseButtonDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {parsing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={14} color="#fff" />
                    <Text style={styles.parseButtonText}>Parse</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or enter manually</Text>
              <View style={styles.orLine} />
            </View>

            {/* Manual entry */}
            <View style={styles.manualRow}>
              <View style={styles.costBlock}>
                <Text style={styles.fieldLabel}>You paid</Text>
                <View style={styles.currencyWrap}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.currencyInput}
                    value={purchaseCost}
                    onChangeText={setPurchaseCost}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={styles.forLabel}>for</Text>

              <View style={styles.amountBlock}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.unitBlock}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <UnitPicker
                  value={unit}
                  onChange={setUnit}
                  placeholder="unit"
                  suggestions={suggestions}
                  compact
                />
              </View>
            </View>

            {/* Container descriptor */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
              Comes as <Text style={styles.fieldLabelMuted}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.containerInput}
              value={container}
              onChangeText={setContainer}
              placeholder="e.g. 50 lb sack, case of 6, #10 can"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Live validation sentence */}
            {preview.costPerUnit !== null && (
              <View style={styles.previewBlock}>
                <View style={styles.previewIconRow}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.accent} />
                  <Text style={styles.previewIconLabel}>Looks right?</Text>
                </View>
                <Text style={styles.previewRate}>{preview.rate}</Text>
                <Text style={styles.previewBreakdown}>{preview.breakdown}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={({ pressed }) => [
                styles.saveButton,
                !canSave && styles.saveButtonDisabled,
                pressed && canSave && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.saveButtonText}>Save cost</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default PriceEditorSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '600',
    marginTop: 2,
  },
  scroll: {
    maxHeight: 520,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  parseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  parseInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget.min,
    textAlignVertical: 'top',
  },
  parseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  parseButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  parseButtonText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  orText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  costBlock: {
    flex: 1.2,
  },
  amountBlock: {
    flex: 0.9,
  },
  unitBlock: {
    flex: 1,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  fieldLabelMuted: {
    color: Colors.textMuted,
    textTransform: 'none',
    fontSize: FontSize.xs,
    fontWeight: '400',
    letterSpacing: 0,
  },
  currencyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTarget.min,
    gap: 4,
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  currencyInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontFamily: MONO_FONT,
    paddingVertical: Spacing.sm,
  },
  forLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    paddingBottom: Spacing.md,
  },
  amountInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontFamily: MONO_FONT,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
    textAlign: 'center',
  },
  containerInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
  },
  previewBlock: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundDeep,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  previewIconLabel: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  previewRate: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    fontFamily: MONO_FONT,
  },
  previewBreakdown: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.min,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
