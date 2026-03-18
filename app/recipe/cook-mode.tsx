import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";
import { useRecipeStore } from "@/store/useRecipeStore";
import { scaleAmount, formatQuantity, getUnitAbbreviation } from "@/lib/scaling";
import type { RecipeWithDetails } from "@/lib/database";

// Gracefully handle expo-keep-awake
let activateKeepAwakeAsync: (() => Promise<void>) | null = null;
let deactivateKeepAwake: (() => void) | null = null;
try {
  const keepAwake = require("expo-keep-awake");
  activateKeepAwakeAsync = keepAwake.activateKeepAwakeAsync;
  deactivateKeepAwake = keepAwake.deactivateKeepAwake;
} catch {
  // expo-keep-awake not available, skip
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CookModeScreen() {
  const { id, servings } = useLocalSearchParams<{ id: string; servings: string }>();
  const insets = useSafeAreaInsets();
  const { loadRecipeDetail } = useRecipeStore();

  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [ingredientsVisible, setIngredientsVisible] = useState(false);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStepIndex, setTimerStepIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetServings = servings ? parseInt(servings, 10) : 1;

  // Load recipe
  useEffect(() => {
    (async () => {
      if (id) {
        const r = await loadRecipeDetail(id);
        if (r) setRecipe(r);
        setLoading(false);
      }
    })();
  }, [id]);

  // Keep screen awake
  useEffect(() => {
    if (activateKeepAwakeAsync) {
      activateKeepAwakeAsync().catch(() => {});
    }
    return () => {
      if (deactivateKeepAwake) {
        deactivateKeepAwake();
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setTimerActive(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Timer Done!", "Your timer has finished.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerActive, timerStepIndex]);

  // Scaled ingredients
  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) =>
      scaleAmount(
        ing.amount,
        recipe.baseServings,
        targetServings,
        ing.unit,
        ing.isScalable !== 0
      )
    );
  }, [recipe, targetServings]);

  const instructions = recipe?.instructions || [];
  const totalSteps = instructions.length;
  const currentInstruction = instructions[currentStep];

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    router.back();
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const handleStartTimer = useCallback((minutes: number, stepIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerSeconds(minutes * 60);
    setTimerStepIndex(stepIdx);
    setTimerActive(true);
  }, []);

  const handleCancelTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerActive(false);
    setTimerSeconds(0);
    setTimerStepIndex(null);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!recipe || totalSteps === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {!recipe ? "Recipe not found" : "No instructions available"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} style={styles.closeBtn} testID="cook-mode-close">
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.stepCounter}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIngredientsVisible(!ingredientsVisible);
          }}
          style={styles.ingredientsBtn}
          testID="ingredients-drawer-btn"
        >
          <Ionicons name="list" size={20} color={Colors.textPrimary} />
          <Text style={styles.ingredientsBtnText}>Ingredients</Text>
        </Pressable>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Number */}
        <Text style={styles.stepNumber}>Step {currentStep + 1}</Text>

        {/* Instruction Text */}
        <Text style={styles.instructionText}>{currentInstruction.text}</Text>

        {/* Photo */}
        {currentInstruction.photoUri ? (
          <Image
            source={{ uri: currentInstruction.photoUri }}
            style={styles.stepPhoto}
            resizeMode="cover"
          />
        ) : null}

        {/* Temperature Badge */}
        {currentInstruction.temperature ? (
          <View style={styles.temperatureBadge}>
            <Ionicons name="thermometer-outline" size={20} color={Colors.accent} />
            <Text style={styles.temperatureText}>{currentInstruction.temperature}</Text>
          </View>
        ) : null}

        {/* Timer Button */}
        {currentInstruction.timerMinutes ? (
          timerActive && timerStepIndex === currentStep ? (
            <View style={styles.timerActiveContainer}>
              <Text style={styles.timerCountdown}>{formatTime(timerSeconds)}</Text>
              <Pressable
                onPress={handleCancelTimer}
                style={({ pressed }) => [styles.timerCancelBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="stop-circle-outline" size={22} color={Colors.error} />
                <Text style={styles.timerCancelText}>Cancel Timer</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => handleStartTimer(currentInstruction.timerMinutes!, currentStep)}
              style={({ pressed }) => [styles.timerBtn, pressed && { opacity: 0.7 }]}
              testID="start-timer-btn"
            >
              <Ionicons name="timer-outline" size={24} color={Colors.textPrimary} />
              <Text style={styles.timerBtnText}>
                Start {currentInstruction.timerMinutes} min timer
              </Text>
            </Pressable>
          )
        ) : null}

        {/* Persistent timer indicator when on a different step */}
        {timerActive && timerStepIndex !== currentStep ? (
          <View style={styles.persistentTimer}>
            <Ionicons name="timer" size={18} color={Colors.accent} />
            <Text style={styles.persistentTimerText}>
              Timer running: {formatTime(timerSeconds)} (Step {(timerStepIndex ?? 0) + 1})
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {instructions.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentStep && styles.dotActive,
                idx < currentStep && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          <Pressable
            onPress={handlePrevious}
            disabled={currentStep === 0}
            style={({ pressed }) => [
              styles.navBtn,
              styles.navBtnPrev,
              currentStep === 0 && styles.navBtnDisabled,
              pressed && currentStep > 0 && { opacity: 0.7 },
            ]}
            testID="cook-mode-prev"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentStep === 0 ? Colors.textMuted : Colors.textPrimary}
            />
            <Text
              style={[
                styles.navBtnText,
                currentStep === 0 && styles.navBtnTextDisabled,
              ]}
            >
              Previous
            </Text>
          </Pressable>

          <Pressable
            onPress={currentStep === totalSteps - 1 ? handleClose : handleNext}
            style={({ pressed }) => [
              styles.navBtn,
              styles.navBtnNext,
              pressed && { opacity: 0.7 },
            ]}
            testID="cook-mode-next"
          >
            <Text style={styles.navBtnText}>
              {currentStep === totalSteps - 1 ? "Done" : "Next"}
            </Text>
            <Ionicons
              name={currentStep === totalSteps - 1 ? "checkmark" : "arrow-forward"}
              size={24}
              color={Colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>

      {/* INGREDIENTS DRAWER OVERLAY */}
      {ingredientsVisible ? (
        <Pressable
          style={styles.drawerOverlay}
          onPress={() => setIngredientsVisible(false)}
        >
          <Pressable
            style={[styles.drawerContent, { paddingBottom: insets.bottom + Spacing.lg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Scaled Ingredients</Text>
              <Pressable
                onPress={() => setIngredientsVisible(false)}
                style={styles.drawerCloseBtn}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>
            <Text style={styles.drawerServings}>
              {targetServings} {recipe.baseYieldUnit || "servings"}
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.drawerScroll}
            >
              {recipe.ingredients.map((ing, idx) => {
                const scaled = scaledIngredients[idx];
                return (
                  <View key={ing.id} style={styles.drawerIngredient}>
                    <Text style={styles.drawerIngAmount}>{scaled.display}</Text>
                    <Text style={styles.drawerIngName}>
                      {ing.name}
                      {ing.prepNote ? `, ${ing.prepNote}` : ""}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontFamily: "Inter_400Regular",
  },

  // Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCounter: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  ingredientsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  ingredientsBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },

  // Main Content
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: Spacing.lg,
  },
  instructionText: {
    fontSize: 26,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: Spacing.xl,
  },
  stepPhoto: {
    width: SCREEN_WIDTH - Spacing.xxl * 2,
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  temperatureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent + "20",
    borderWidth: 1,
    borderColor: Colors.accent + "40",
    marginBottom: Spacing.xl,
  },
  temperatureText: {
    fontSize: FontSize.lg,
    color: Colors.accent,
    fontFamily: "Inter_700Bold",
  },

  // Timer
  timerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    minHeight: 56,
    marginBottom: Spacing.xl,
  },
  timerBtnText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  timerActiveContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  timerCountdown: {
    fontSize: 64,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    marginBottom: Spacing.md,
  },
  timerCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  timerCancelText: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontFamily: "Inter_600SemiBold",
  },
  persistentTimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent + "15",
    borderWidth: 1,
    borderColor: Colors.accent + "30",
    marginBottom: Spacing.xl,
  },
  persistentTimerText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundElevated,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: Colors.primary + "60",
  },
  navButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 64,
    borderRadius: BorderRadius.lg,
  },
  navBtnPrev: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnNext: {
    backgroundColor: Colors.primary,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  navBtnTextDisabled: {
    color: Colors.textMuted,
  },

  // Ingredients Drawer
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  drawerContent: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    maxHeight: "70%",
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  drawerTitle: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  drawerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerServings: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: Spacing.md,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerIngredient: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  drawerIngAmount: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    minWidth: 80,
  },
  drawerIngName: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
  },
});
