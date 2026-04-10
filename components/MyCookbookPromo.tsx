import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Colors, BorderRadius, Spacing, FontSize } from "@/constants/theme";

const MYCOOKBOOK_APP_STORE_URL = "https://apps.apple.com/app/mycookbook/id_YOUR_MYCOOKBOOK_ID";
const DISMISSED_KEY = "@chefscale_mycookbook_promo_dismissed";

interface MyCookbookPromoProps {
  trigger: "organize" | "mealplan" | "cooking" | "settings";
  compact?: boolean;
}

const messages = {
  organize: {
    title: "Organize Your Collection",
    body: "MyCookbook lets you build a personal digital cookbook \u2014 organize by station or category, with a beautiful card-based layout.",
    icon: "book-outline" as const,
  },
  mealplan: {
    title: "Meal Planning & Grocery Lists",
    body: "MyCookbook generates weekly meal plans and auto-consolidated shopping lists from your saved recipes.",
    icon: "calendar-outline" as const,
  },
  cooking: {
    title: "Hands-Free Cooking Mode",
    body: "MyCookbook has a dedicated cooking mode with step-by-step navigation, keep-awake, and ingredient check-off.",
    icon: "flame-outline" as const,
  },
  settings: {
    title: "Also by ALSTIG INC",
    body: "MyCookbook \u2014 your personal digital cookbook. Organize, collect, and cook from your recipe collection.",
    icon: "book-outline" as const,
  },
};

export default function MyCookbookPromo({ trigger, compact = false }: MyCookbookPromoProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const msg = messages[trigger];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(MYCOOKBOOK_APP_STORE_URL);
  };

  const handleDismiss = async () => {
    Haptics.selectionAsync();
    setDismissed(true);
    const raw = await AsyncStorage.getItem(DISMISSED_KEY);
    const dismissals = JSON.parse(raw || "[]");
    dismissals.push({ trigger, date: new Date().toISOString() });
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissals));
  };

  if (compact) {
    return (
      <Pressable onPress={handlePress} style={styles.compactContainer}>
        <Ionicons name={msg.icon} size={16} color={Colors.primary} />
        <Text style={styles.compactText} numberOfLines={1}>
          {msg.title} — Try MyCookbook
        </Text>
        <Ionicons name="open-outline" size={14} color={Colors.primary} />
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name={msg.icon} size={20} color={Colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{msg.title}</Text>
          <Text style={styles.appLabel}>MyCookbook by ALSTIG INC</Text>
        </View>
        <Pressable onPress={handleDismiss} hitSlop={12}>
          <Ionicons name="close" size={18} color={Colors.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.body}>{msg.body}</Text>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.ctaText}>View on App Store</Text>
        <Ionicons name="open-outline" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.textPrimary,
  },
  appLabel: {
    fontSize: FontSize.xs,
    fontFamily: "DMSans_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  body: {
    fontSize: FontSize.sm,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  ctaText: {
    fontSize: FontSize.sm,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    backgroundColor: Colors.primary + "10",
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  compactText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.primary,
  },
});
