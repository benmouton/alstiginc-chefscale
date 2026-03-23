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
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import MyCookbookPromo from "@/components/MyCookbookPromo";
import { buildRecipeCSV, buildPriceCSV, shareCSV } from "@/lib/csvExport";
import { getAllPrices, getIngredientsByRecipeId } from "@/lib/database";
import type { IngredientRow } from "@/lib/database";

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
      <View style={[styles.settingsIcon, { backgroundColor: (color || Colors.textSecondary) + '26' }]}>
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

const APPEARANCE_OPTIONS: { label: string; value: 'dark' | 'light' | 'system' }[] = [
  { label: 'Dark mode', value: 'dark' },
  { label: 'Light mode', value: 'light' },
  { label: 'System default', value: 'system' },
];

const UNIT_OPTIONS: { label: string; value: 'us' | 'metric' }[] = [
  { label: 'US Customary', value: 'us' },
  { label: 'Metric', value: 'metric' },
];

const SERVING_OPTIONS = [1, 2, 4, 6, 8, 10, 12];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { recipes, clearAllData, loadRecipes } = useRecipeStore();

  const { tier, isTrialing, trialEndsAt } = useSubscriptionStore();
  const checkAccess = useSubscriptionStore((s) => s.checkAccess);
  const getPaywallHeadline = useSubscriptionStore((s) => s.getPaywallHeadline);

  const { appearance, unitSystem, defaultServings, setAppearance, setUnitSystem, setDefaultServings } = useSettingsStore();

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const appearanceLabel = APPEARANCE_OPTIONS.find((o) => o.value === appearance)?.label || 'Dark mode';
  const unitLabel = UNIT_OPTIONS.find((o) => o.value === unitSystem)?.label || 'US Customary';

  const handleAppearance = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Appearance',
      'Choose your preferred theme',
      APPEARANCE_OPTIONS.map((opt) => ({
        text: opt.label + (opt.value === appearance ? ' ✓' : ''),
        onPress: () => setAppearance(opt.value),
      }))
    );
  };

  const handleUnits = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Default Units',
      'Choose your preferred unit system',
      UNIT_OPTIONS.map((opt) => ({
        text: opt.label + (opt.value === unitSystem ? ' ✓' : ''),
        onPress: () => setUnitSystem(opt.value),
      }))
    );
  };

  const handleServings = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Default Servings',
      'Choose the default number of servings for new recipes',
      [
        ...SERVING_OPTIONS.map((n) => ({
          text: `${n} serving${n !== 1 ? 's' : ''}` + (n === defaultServings ? ' ✓' : ''),
          onPress: () => setDefaultServings(n),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleExportRecipes = async () => {
    if (!checkAccess('export')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: '/paywall', params: { feature: 'export', headline: getPaywallHeadline('export') } });
      return;
    }

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

  const handleExportCSV = async () => {
    if (!checkAccess('export')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: '/paywall', params: { feature: 'export', headline: getPaywallHeadline('export') } });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (recipes.length === 0) {
      Alert.alert("No Data", "There are no recipes to export.");
      return;
    }

    try {
      // Load ingredients for each recipe
      const ingredientCache = new Map<string, IngredientRow[]>();
      for (const recipe of recipes) {
        ingredientCache.set(recipe.id, await getIngredientsByRecipeId(recipe.id));
      }

      const prices = await getAllPrices();

      const recipeCSV = buildRecipeCSV(recipes, (id) => ingredientCache.get(id) ?? []);
      const priceCSV = buildPriceCSV(prices);
      const combined = recipeCSV + '\n\n--- Ingredient Prices ---\n\n' + priceCSV;

      await shareCSV(combined, 'chefscale-export');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      if ((e as any)?.message?.includes("User did not share")) return;
      Alert.alert("Export Failed", "Could not export data. Please try again.");
    }
  };

  const handleImportRecipes = () => {
    if (!checkAccess('import')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: '/paywall', params: { feature: 'import', headline: getPaywallHeadline('import') } });
      return;
    }

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

  const handleSendFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("mailto:support@restaurantai.consulting?subject=ChefScale%20Feedback");
  };

  const handleConsultantLink = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("https://restaurantai.consulting");
  };

  const handlePrivacyPolicy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/privacy');
  };

  const handleTermsOfService = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/terms');
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/paywall', params: { feature: 'unlimited_recipes', headline: getPaywallHeadline('unlimited_recipes') } });
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
        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="color-palette-outline"
              label="Appearance"
              subtitle={appearanceLabel}
              color={Colors.primary}
              onPress={handleAppearance}
            />
            <SettingsRow
              icon="scale-outline"
              label="Default Units"
              subtitle={unitLabel}
              color={Colors.accent}
              onPress={handleUnits}
            />
            <SettingsRow
              icon="people-outline"
              label="Default Servings"
              subtitle={`${defaultServings} serving${defaultServings !== 1 ? 's' : ''}`}
              color="#8B5CF6"
              onPress={handleServings}
            />
          </View>
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          {tier === 'free' ? (
            <Pressable
              onPress={handleUpgrade}
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={['#1A1008', '#251A0A']}
                style={styles.upgradeBanner}
              >
                <View style={styles.upgradeBannerContent}>
                  <View style={styles.upgradeIconCircle}>
                    <Ionicons name="star" size={24} color="#D97706" />
                  </View>
                  <View style={styles.upgradeBannerText}>
                    <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                    <Text style={styles.upgradeSubtitle}>Unlock export, import, nutrition, and more</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#D97706" />
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.sectionCard}>
              <View style={styles.subscriptionStatusRow}>
                <View style={styles.statusIconCircle}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                </View>
                <View style={styles.settingsContent}>
                  <Text style={styles.settingsLabel}>
                    {isTrialing ? 'Trial' : 'Premium'}
                  </Text>
                  <Text style={styles.settingsSubtitle}>
                    {isTrialing ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left` : 'Active subscription'}
                  </Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Data */}
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
              icon="document-text-outline"
              label="Export as CSV"
              subtitle="Recipes and prices for spreadsheets"
              color="#10B981"
              onPress={handleExportCSV}
            />
            <SettingsRow
              icon="cloud-download-outline"
              label="Import Recipes"
              subtitle="Load from file"
              color={Colors.success}
              onPress={handleImportRecipes}
            />
          </View>
          <View style={styles.dangerCard}>
            <SettingsRow
              icon="trash-outline"
              label="Clear All Data"
              subtitle="Delete everything"
              color={Colors.error}
              onPress={handleClearData}
            />
          </View>
        </View>

        {/* About */}
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
            <SettingsRow
              icon="mail-outline"
              label="Send Feedback"
              subtitle="support@restaurantai.consulting"
              color="#3B82F6"
              onPress={handleSendFeedback}
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              color={Colors.textSecondary}
              onPress={handlePrivacyPolicy}
            />
            <SettingsRow
              icon="document-text-outline"
              label="Terms of Service"
              color={Colors.textSecondary}
              onPress={handleTermsOfService}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Other Apps</Text>
          <MyCookbookPromo trigger="settings" />
        </View>

        <Pressable
          onPress={handleConsultantLink}
          style={({ pressed }) => [styles.consultantBanner, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.consultantBannerContent}>
            <Ionicons name="diamond-outline" size={20} color={Colors.accent} />
            <Text style={styles.consultantBannerText}>
              Get Premium free with a Restaurant Consultant subscription
            </Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </View>
        </Pressable>

        <Pressable
          onPress={handleConsultantLink}
          style={({ pressed }) => [styles.consultantFooter, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="restaurant" size={16} color={Colors.primary} />
          <Text style={styles.consultantText}>Powered by The Restaurant Consultant</Text>
        </Pressable>

        <Text style={styles.versionFooter}>ChefScale v1.0.0</Text>

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
    paddingBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: '#D97706',
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: "hidden",
    padding: 4,
    marginHorizontal: 16,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    minHeight: 56,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D97706',
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
  upgradeBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.3)',
    overflow: "hidden",
    marginHorizontal: 16,
  },
  upgradeBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  upgradeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217,119,6,0.15)',
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: FontSize.md,
    fontWeight: "700" as const,
    color: '#D97706',
    fontFamily: "Inter_700Bold",
  },
  upgradeSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  subscriptionStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    minHeight: 56,
  },
  statusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.success + '20',
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  activeBadge: {
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "600" as const,
    color: Colors.success,
    fontFamily: "Inter_600SemiBold",
  },
  dangerCard: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    overflow: "hidden",
    padding: 4,
    marginHorizontal: 16,
    marginTop: Spacing.sm,
  },
  consultantBanner: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: Spacing.sm,
    marginHorizontal: 16,
  },
  consultantBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  consultantBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  consultantFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  consultantText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontFamily: "Inter_400Regular",
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: Spacing.xs,
  },
});
