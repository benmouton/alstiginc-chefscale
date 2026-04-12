import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, TouchTarget } from '@/constants/theme';
import { UNITS, COMMON_UNITS } from '@/constants/units';

interface UnitPickerProps {
  value: string;
  onChange: (unit: string) => void;
  placeholder?: string;
  /** Units to highlight as quick-chips at the top of the modal. */
  suggestions?: string[];
  /** Optional compact style for inline contexts. */
  compact?: boolean;
}

/**
 * Searchable unit dropdown. Shows the current value in a button;
 * tapping opens a modal with a search filter and scrollable list of
 * every unit in constants/units.ts. If `suggestions` is provided,
 * those units appear as quick-chips above the full list.
 */
export function UnitPicker({
  value,
  onChange,
  placeholder = 'Select unit',
  suggestions,
  compact = false,
}: UnitPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const allUnits = useMemo(() => {
    // Order: suggestions (if any) first, then the rest alphabetically by abbreviation.
    const keys = Object.keys(UNITS);
    const seen = new Set<string>();
    const ordered: string[] = [];
    if (suggestions) {
      for (const s of suggestions) {
        if (UNITS[s] && !seen.has(s)) {
          ordered.push(s);
          seen.add(s);
        }
      }
    }
    const rest = keys
      .filter((k) => !seen.has(k))
      .sort((a, b) => UNITS[a].abbreviation.localeCompare(UNITS[b].abbreviation));
    return [...ordered, ...rest];
  }, [suggestions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUnits;
    return allUnits.filter((k) => {
      const u = UNITS[k];
      return (
        k.toLowerCase().includes(q) ||
        u.abbreviation.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
      );
    });
  }, [allUnits, query]);

  const displayLabel = value && UNITS[value] ? UNITS[value].abbreviation : value || placeholder;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.button,
          compact && styles.buttonCompact,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            (!value || !UNITS[value]) && styles.buttonPlaceholder,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select unit</Text>
              <Pressable onPress={close} hitSlop={12}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search units…"
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>

            {suggestions && suggestions.length > 0 && !query && (
              <View style={styles.suggestionRow}>
                <Text style={styles.suggestionLabel}>Suggested</Text>
                <View style={styles.chipRow}>
                  {suggestions.filter((s) => UNITS[s]).map((s) => (
                    <Pressable
                      key={`sug-${s}`}
                      onPress={() => {
                        onChange(s);
                        close();
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        value === s && styles.chipActive,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text
                        style={[styles.chipText, value === s && styles.chipTextActive]}
                      >
                        {UNITS[s].abbreviation}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.divider} />
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={(k) => k}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const u = UNITS[item];
                const selected = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      close();
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      selected && styles.rowSelected,
                      pressed && { backgroundColor: Colors.backgroundDeep },
                    ]}
                  >
                    <Text style={[styles.rowAbbr, selected && styles.rowAbbrSelected]}>
                      {u.abbreviation}
                    </Text>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {u.name}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.empty}>No units match &ldquo;{query}&rdquo;</Text>
              }
              style={styles.list}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// Default export for convenience
export default UnitPicker;

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
    gap: Spacing.sm,
  },
  buttonCompact: {
    minHeight: 40,
    paddingVertical: 6,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    flex: 1,
  },
  buttonPlaceholder: {
    color: Colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '75%',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: 4,
  },
  suggestionRow: {
    marginBottom: Spacing.md,
  },
  suggestionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowSelected: {
    backgroundColor: Colors.backgroundDeep,
  },
  rowAbbr: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    width: 60,
  },
  rowAbbrSelected: {
    color: Colors.primary,
  },
  rowName: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },
  empty: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    paddingVertical: Spacing.xxl,
  },
});

// Export the constant set for convenience
export { COMMON_UNITS };
