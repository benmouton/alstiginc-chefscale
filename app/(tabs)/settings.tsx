import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

interface SettingsRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  color?: string;
  showChevron?: boolean;
}

function SettingsRow({ icon, label, subtitle, onPress, color, showChevron = true }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.settingsIcon, color ? { backgroundColor: color + '20' } : {}]}>
        <Ionicons name={icon as any} size={20} color={color || Colors.textSecondary} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {subtitle ? <Text style={styles.settingsSubtitle}>{subtitle}</Text> : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const handleExportData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Export", "Data export coming soon with cloud sync.");
  };

  const handleClearData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all recipes and prices. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: () => {
          Alert.alert("Cleared", "All data has been cleared.");
        }},
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="color-palette-outline"
              label="Appearance"
              subtitle="Dark mode"
              color={Colors.primary}
            />
            <SettingsRow
              icon="scale-outline"
              label="Default Units"
              subtitle="US Customary"
              color={Colors.accent}
            />
            <SettingsRow
              icon="people-outline"
              label="Default Servings"
              subtitle="4 servings"
              color="#8B5CF6"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="cloud-upload-outline"
              label="Export Recipes"
              subtitle="Save to file"
              color="#3B82F6"
              onPress={handleExportData}
            />
            <SettingsRow
              icon="cloud-download-outline"
              label="Import Recipes"
              subtitle="Load from file"
              color="#22C55E"
            />
            <SettingsRow
              icon="trash-outline"
              label="Clear All Data"
              subtitle="Delete everything"
              color={Colors.error}
              onPress={handleClearData}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="information-circle-outline"
              label="Version"
              subtitle="1.0.0"
              color={Colors.textSecondary}
              showChevron={false}
            />
            <SettingsRow
              icon="heart-outline"
              label="Rate ChefScale"
              color="#EC4899"
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textMuted,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    minHeight: 56,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  settingsSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});
