import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";
import { CROSS_PROMO_ENABLED } from "@/lib/crossPromo/featureFlag";
import {
  APP_STORE_URLS,
  getPromoEntry,
  getPromoVariant,
  type AppKey,
} from "@/lib/crossPromo/registry";
import {
  isDismissed,
  isFrequencyCapped,
  markDismissed,
  markShown,
  tryClaimSessionSlot,
  unmarkShownThisSession,
} from "@/lib/crossPromo/eligibility";
import { trackCrossPromoEvent } from "@/lib/crossPromo/analytics";

interface CrossPromoCardProps {
  sourceApp: AppKey;
  targetApp: AppKey;
  placement: string;
  active?: boolean;
  onDismiss?: () => void;
}

export function CrossPromoCard({
  sourceApp,
  targetApp,
  placement,
  active = true,
  onDismiss,
}: CrossPromoCardProps) {
  const [visible, setVisible] = useState(false);
  const committedRef = useRef(false);

  const entry = getPromoEntry(sourceApp, targetApp);
  const variant = getPromoVariant(sourceApp, targetApp, placement);
  const ctaUrl = entry?.ctaUrl ?? APP_STORE_URLS[targetApp];

  useEffect(() => {
    if (!active || !CROSS_PROMO_ENABLED || !variant) return;
    if (!tryClaimSessionSlot(sourceApp, targetApp)) return;

    let cancelled = false;
    (async () => {
      try {
        const [dismissed, freqCapped] = await Promise.all([
          isDismissed(sourceApp, targetApp),
          isFrequencyCapped(sourceApp),
        ]);
        if (cancelled || dismissed || freqCapped) {
          unmarkShownThisSession(sourceApp, targetApp);
          return;
        }
        setVisible(true);
        committedRef.current = true;
        await markShown(sourceApp);
        await trackCrossPromoEvent("cross_promo_banner_impression", {
          source_app: sourceApp,
          target_app: targetApp,
          trigger_event: variant.triggerEvent,
          placement,
        });
      } catch {
        // Never block product flows.
      }
    })();
    return () => {
      cancelled = true;
      if (!committedRef.current) unmarkShownThisSession(sourceApp, targetApp);
    };
  }, [active, sourceApp, targetApp, placement, variant]);

  if (!visible || !variant || !ctaUrl) return null;

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await trackCrossPromoEvent("cross_promo_banner_clicked", {
      source_app: sourceApp,
      target_app: targetApp,
      trigger_event: variant.triggerEvent,
      placement,
    });
    Linking.openURL(ctaUrl);
  };

  const handleDismiss = async () => {
    Haptics.selectionAsync();
    setVisible(false);
    await markDismissed(sourceApp, targetApp);
    await trackCrossPromoEvent("cross_promo_banner_dismissed", {
      source_app: sourceApp,
      target_app: targetApp,
      trigger_event: variant.triggerEvent,
      placement,
    });
    onDismiss?.();
  };

  const appLabel = entry ? `By ALSTIG · ${entry.targetAppLabel}` : `By ALSTIG · ${targetApp}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name={variant.icon} size={20} color={Colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{variant.headline}</Text>
          <Text style={styles.appLabel}>{appLabel}</Text>
        </View>
        <Pressable onPress={handleDismiss} hitSlop={12} accessibilityLabel="Dismiss promo">
          <Ionicons name="close" size={18} color={Colors.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.body}>{variant.body}</Text>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}
        accessibilityLabel={variant.ctaLabel}
      >
        <Text style={styles.ctaText}>{variant.ctaLabel}</Text>
        <Ionicons name="open-outline" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm + 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary + "20",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  appLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  body: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  ctaText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "#fff",
  },
});
