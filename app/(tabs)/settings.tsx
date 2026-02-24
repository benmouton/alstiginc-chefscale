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
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";

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
      style={({ pressed }) => [styles.settingsRow, pressed && onPress && { opacity: 0.7 }]}
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
  const { recipes, clearAllData, loadRecipes } = useRecipeStore();

  const handleExportRecipes = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (recipes.length === 0) {
      Alert.alert("No Recipes", "There are no recipes to export. Add some recipes first.");
      return;
    }

    try {
      const exportData = {
        app: "ChefScale",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        recipeCount: recipes.length,
        recipes: recipes,
      };
      const jsonString = JSON.stringify(exportData, null, 2);

      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chefscale-recipes-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert("Exported", `${recipes.length} recipe(s) downloaded as JSON.`);
      } else {
        const fileName = `chefscale-recipes-${new Date().toISOString().split("T")[0]}.json`;
        const filePath = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(filePath, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Share.share({
          url: filePath,
          title: "ChefScale Recipes Export",
          message: `ChefScale recipe export - ${recipes.length} recipe(s)`,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      if ((e as any)?.message?.includes("User did not share")) return;
      Alert.alert("Export Failed", "Could not export recipes. Please try again.");
    }
  };

  const handleImportRecipes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Coming Soon", "Recipe import will be available in a future update.");
  };

  const handleClearData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all recipes and prices. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              'To confirm, please acknowledge that you want to DELETE all data. This is irreversible.',
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "DELETE",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await clearAllData();
                      await loadRecipes();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert("Data Cleared", "All recipes and prices have been deleted.");
                    } catch {
                      Alert.alert("Error", "Failed to clear data. Please try again.");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Rate ChefScale",
      "App Store rating will be available once ChefScale is published. Thank you for your support!"
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
              showChevron={false}
            />
            <SettingsRow
              icon="scale-outline"
              label="Default Units"
              subtitle="US Customary"
              color={Colors.accent}
              showChevron={false}
            />
            <SettingsRow
              icon="people-outline"
              label="Default Servings"
              subtitle="4 servings"
              color="#8B5CF6"
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="cloud-upload-outline"
              label="Export Recipes"
              subtitle={`Save ${recipes.length} recipe(s) to file`}
              color="#3B82F6"
              onPress={handleExportRecipes}
            />
            <SettingsRow
              icon="cloud-download-outline"
              label="Import Recipes"
              subtitle="Load from file"
              color={Colors.success}
              onPress={handleImportRecipes}
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
            <View style={styles.brandingContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="restaurant-outline" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.appName}>ChefScale</Text>
              <Text style={styles.tagline}>Scale with confidence</Text>
            </View>
            <SettingsRow
              icon="information-circle-outline"
              label="Version"
              subtitle="1.0.0 (Phase 7)"
              color={Colors.textSecondary}
              showChevron={false}
            />
            <SettingsRow
              icon="briefcase-outline"
              label="Made for professional kitchens"
              color={Colors.primaryLight}
              showChevron={false}
            />
            <SettingsRow
              icon="heart-outline"
              label="Rate ChefScale"
              color="#EC4899"
              onPress={handleRateApp}
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
    fontWeight: "700" as const,
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
    fontWeight: "600" as const,
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
  brandingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
});
