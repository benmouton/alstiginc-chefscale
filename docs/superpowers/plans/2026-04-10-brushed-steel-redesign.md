# Brushed Steel UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ChefScale from generic Inter/amber/black to a distinctive "Brushed Steel" identity — cool blue-gray steel surfaces, embossed depth, DM Sans + SF Mono typography, orange operational accent. All screens, one release.

**Architecture:** Theme-first approach. Update palette and fonts (cascading to all screens), then components, then screen-specific layouts. No decorative animations — only functional number transitions.

**Tech Stack:** Expo/React Native, DM Sans (`@expo-google-fonts/dm-sans`), SF Mono (system), react-native-reanimated v4, expo-haptics

**Spec:** `docs/superpowers/specs/2026-04-10-brushed-steel-design.md`

---

## File Map

### Modified Files (22 files with Inter_ references + theme + components)

| File | Responsibility |
|------|---------------|
| `constants/theme.ts` | Brushed Steel palette, spacing, typography tokens |
| `constants/colors.ts` | Legacy color export, sync with theme |
| `app/_layout.tsx` | Font loading (DM Sans), root stack styling |
| `app/(tabs)/_layout.tsx` | Tab bar styling |
| `components/GlassCard.tsx` | → Rename to SteelCard |
| `components/RecipeCard.tsx` | Vertical list card with accent stripe |
| `components/ScalingControls.tsx` | Steel buttons, SF Mono numbers |
| `components/CostSummary.tsx` | SF Mono numbers, color-coded FC% |
| `components/NutritionCard.tsx` | Steel palette |
| `components/AllergenBadge.tsx` | Steel border style |
| `components/AllergenList.tsx` | Updated styling |
| `components/PremiumGate.tsx` | Steel overlay |
| `components/ProBadge.tsx` | Orange badge |
| `components/MyCookbookPromo.tsx` | Steel card |
| `components/IngredientRow.tsx` | SF Mono amounts |
| `components/InstructionStep.tsx` | Steel styling |
| `components/TimerOverlay.tsx` | SF Mono timer |
| `app/(tabs)/index.tsx` | Stats dashboard, vertical recipe list |
| `app/(tabs)/prices.tsx` | Steel cards, SF Mono prices |
| `app/(tabs)/converter.tsx` | SF Mono values, steel presets |
| `app/(tabs)/settings.tsx` | Grouped steel sections, fix hardcoded version |
| `app/(tabs)/add.tsx` | Fix stale background color |
| `app/recipe/[id].tsx` | Detail overhaul |
| `app/recipe/edit.tsx` | Form steel styling |
| `app/recipe/cook-mode.tsx` | Focused cooking UI, SF Mono timer |
| `app/paywall.tsx` | Steel plan cards |
| `app/prep-sheet.tsx` | Table layout, SF Mono quantities |
| `app/privacy.tsx` | Steel text |
| `app/terms.tsx` | Steel text |
| `app/+not-found.tsx` | Font update |

### New Files
| File | Responsibility |
|------|---------------|
| `components/SteelCard.tsx` | Embossed steel container (replaces GlassCard) |

---

## Task 1: Install DM Sans + Swap Font Loading + Global Replace

**Files:**
- Modify: `package.json`
- Modify: `app/_layout.tsx`
- Modify: All 22 files with `Inter_` references

- [ ] **Step 1: Install DM Sans font package**

```bash
cd ~/Developer/alstiginc-chefscale && npm install @expo-google-fonts/dm-sans
```

- [ ] **Step 2: Update font loading in root layout**

In `app/_layout.tsx`, replace Inter imports with:
```tsx
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
```

Update the `useFonts` call to use DM Sans variants.

- [ ] **Step 3: Global find-and-replace Inter_ → DMSans_ across all files**

```
Inter_400Regular  →  DMSans_400Regular
Inter_600SemiBold →  DMSans_600SemiBold
Inter_700Bold     →  DMSans_700Bold
```

Note: Inter only uses 3 weights (400, 600, 700). DM Sans has 500 available but don't add it where it wasn't used.

229 occurrences across 22 files.

- [ ] **Step 4: Add SF Mono helper constant**

In `constants/theme.ts`, add:
```tsx
export const MONO_FONT = Platform.OS === 'ios' ? 'SF Mono' : 'monospace';
```

Import `Platform` from `react-native`.

- [ ] **Step 5: Verify no Inter_ references remain**

```bash
grep -rn "Inter_" app/ components/ constants/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: swap Inter to DM Sans, add SF Mono constant"
```

---

## Task 2: Update Color Palette (Theme)

**Files:**
- Modify: `constants/theme.ts`
- Modify: `constants/colors.ts`

- [ ] **Step 1: Replace color values in theme.ts**

Update all color tokens to Brushed Steel palette:
- `background`: `#0A0A0A` → `#2a2d32`
- `card/elevated`: `#141414`/`#1E1E1E` → `#32363b`
- `border/glass border`: → `#3a3d42`
- `text primary`: `#F5F5F4` → `#e8eaed`
- `text secondary`: `#A8A29E` → `#8a8d92`
- `text muted`: `#6B7280` → `#52525b`
- `primary`: `#D97706` → `#f97316`
- `primaryDark`: `#B45309` → `#ea580c`
- `primaryLight`: `#F59E0B` → `#fb923c`
- Add `backgroundDeep`: `#22252a`
- Add `innerHighlight`: `rgba(255,255,255,0.04)`
- Add `dropShadow`: `rgba(0,0,0,0.2)`

Keep category colors, allergen colors, and status colors (success/danger/warning) unchanged.

- [ ] **Step 2: Sync colors.ts**

Update the legacy `colors.ts` exports to match the new theme values.

- [ ] **Step 3: Commit**

```bash
git add constants/ && git commit -m "feat: update palette to Brushed Steel — cool blue-gray steel"
```

---

## Task 3: Tab Bar + SteelCard Component

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Create: `components/SteelCard.tsx`
- Remove/rename: `components/GlassCard.tsx`

- [ ] **Step 1: Update ClassicTabLayout**

Background: `backgroundDeep` (#22252a), top border: `border` (#3a3d42). Active tint: `primary` (#f97316). Inactive: `textTertiary`. Remove BlurView.

- [ ] **Step 2: Create SteelCard component**

```tsx
// Embossed steel container — replaces GlassCard
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "@/constants/theme";

interface SteelCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function SteelCard({ children, style, noPadding }: SteelCardProps) {
  return (
    <View style={[styles.card, noPadding && { padding: 0 }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
```

- [ ] **Step 3: Update all GlassCard imports to SteelCard**

Search for any files importing GlassCard and update to SteelCard. (From grep, GlassCard is only used within its own file — may not be imported elsewhere. Check to confirm.)

- [ ] **Step 4: Fix add.tsx stale background**

Change `#0F172A` to `Colors.background` in `app/(tabs)/add.tsx`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: tab bar + SteelCard component"
```

---

## Task 4: RecipeCard Redesign

**Files:**
- Modify: `components/RecipeCard.tsx`

- [ ] **Step 1: Rewrite RecipeCard as vertical list card**

Replace horizontal gradient card with vertical list card:
- Left accent stripe (4px) colored by category
- Recipe name left-aligned, cost/srv right-aligned in SF Mono
- Metadata row: category badge (bordered pill), servings, time, food cost %
- Allergen dots
- Embossed steel card style
- Press: `withTiming(0.98, { duration: 100 })` — crisp, not springy

Read current file first to preserve the interface (props, callbacks).

- [ ] **Step 2: Commit**

```bash
git add components/RecipeCard.tsx && git commit -m "feat: redesign RecipeCard — vertical steel panels with accent stripes"
```

---

## Task 5: ScalingControls + CostSummary + IngredientRow (SF Mono Numbers)

**Files:**
- Modify: `components/ScalingControls.tsx`
- Modify: `components/CostSummary.tsx`
- Modify: `components/IngredientRow.tsx`

- [ ] **Step 1: Update ScalingControls**

- Steel button backgrounds for +/- buttons
- SF Mono for serving count number
- Quick multiplier chips (0.5x, 1x, 2x, 4x) as steel pills with orange active
- Remove unused `baseYieldUnit` prop and dead `yieldTargetUnit` state

- [ ] **Step 2: Update CostSummary**

- All dollar amounts and percentages in SF Mono
- Food cost % color-coded: green (<30%), yellow (30-35%), red (>35%)
- Compact grid, steel card style

- [ ] **Step 3: Update IngredientRow**

- Amount + unit in SF Mono (left)
- Ingredient name in DM Sans (right)
- Yield/as-purchased values in SF Mono
- Steel styling

- [ ] **Step 4: Commit**

```bash
git add components/ScalingControls.tsx components/CostSummary.tsx components/IngredientRow.tsx && git commit -m "feat: SF Mono numbers in scaling, costs, ingredients"
```

---

## Task 6: Remaining Components

**Files:**
- Modify: `components/NutritionCard.tsx`
- Modify: `components/AllergenBadge.tsx`
- Modify: `components/AllergenList.tsx`
- Modify: `components/PremiumGate.tsx`
- Modify: `components/ProBadge.tsx`
- Modify: `components/MyCookbookPromo.tsx`
- Modify: `components/InstructionStep.tsx`
- Modify: `components/TimerOverlay.tsx`

- [ ] **Step 1: Read each file, update palette and fonts**

For each component:
- Replace any hardcoded colors with theme references
- Update font families (already done by Task 1 global replace)
- Use SF Mono for any numerical displays (timer digits, nutrition values)
- Apply steel card styling where applicable

- [ ] **Step 2: TimerOverlay — SF Mono for timer digits**

Timer display should use SF Mono at large size for the countdown.

- [ ] **Step 3: Commit**

```bash
git add components/ && git commit -m "feat: update all components to Brushed Steel palette"
```

---

## Task 7: Home Screen — Stats Dashboard + Vertical List

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Read current home screen**

Understand the current horizontal scroll card layout.

- [ ] **Step 2: Add stats dashboard tiles**

At the top of the screen, add two embossed steel stat tiles:
- "AVG FOOD COST" with SF Mono value, color-coded
- "AVG COST/SRV" with SF Mono value
Calculate from recipe data in the store.

- [ ] **Step 3: Replace horizontal scroll with vertical FlatList**

Change recipe cards from horizontal scroll to vertical FlatList using the redesigned RecipeCard.

- [ ] **Step 4: Update segmented filter styling**

Steel segmented control: `backgroundDeep` container, orange active.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/index.tsx" && git commit -m "feat: home screen — stats dashboard + vertical recipe list"
```

---

## Task 8: Recipe Detail Screen

**Files:**
- Modify: `app/recipe/[id].tsx`

- [ ] **Step 1: Read the file (31KB)**

- [ ] **Step 2: Update background and header**

Steel background. Remove gradient overlays. Category badge with colored border instead of gradient fill.

- [ ] **Step 3: Section headers**

DM Sans 700, 9px, uppercase, letter-spacing 2px, `textSecondary` color.

- [ ] **Step 4: Ingredient amounts in SF Mono**

All measurement numbers (amounts, units) rendered in SF Mono.

- [ ] **Step 5: Cook Mode button**

Orange, full-width, DM Sans 700.

- [ ] **Step 6: Commit**

```bash
git add "app/recipe/[id].tsx" && git commit -m "feat: recipe detail — steel background, SF Mono numbers, sections"
```

---

## Task 9: Prices + Converter + Settings

**Files:**
- Modify: `app/(tabs)/prices.tsx`
- Modify: `app/(tabs)/converter.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Update Prices**

Steel cards per ingredient. Price in SF Mono right-aligned. Search bar with orange focus border.

- [ ] **Step 2: Update Converter**

Large SF Mono for input/output values. Steel preset pills with orange active. Fix the already-corrected preset label.

- [ ] **Step 3: Update Settings**

Grouped steel sections. Uppercase letter-spaced section headers. Fix hardcoded version — use `Constants.expoConfig?.version`.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/prices.tsx" "app/(tabs)/converter.tsx" "app/(tabs)/settings.tsx" && git commit -m "feat: update prices, converter, settings to Brushed Steel"
```

---

## Task 10: Edit Recipe + Cook Mode

**Files:**
- Modify: `app/recipe/edit.tsx`
- Modify: `app/recipe/cook-mode.tsx`

- [ ] **Step 1: Update edit.tsx styling**

This is 2,535 lines — make SURGICAL edits only:
- Steel input fields with orange focus border
- Section headers: DM Sans 700 uppercase
- Save button: orange, full-width
- Replace any hardcoded old-palette colors
- Do NOT restructure the file (that's a separate task)

- [ ] **Step 2: Update cook-mode.tsx**

- Deep background (#22252a)
- Large DM Sans text for current step
- Timer digits in SF Mono at large size
- Step progress: orange progress bar
- Orange Done button

- [ ] **Step 3: Commit**

```bash
git add "app/recipe/edit.tsx" "app/recipe/cook-mode.tsx" && git commit -m "feat: update edit form + cook mode to Brushed Steel"
```

---

## Task 11: Paywall + Prep Sheet + Legal + Not Found

**Files:**
- Modify: `app/paywall.tsx`
- Modify: `app/prep-sheet.tsx`
- Modify: `app/privacy.tsx`
- Modify: `app/terms.tsx`
- Modify: `app/+not-found.tsx`

- [ ] **Step 1: Update paywall**

Steel plan cards, orange border on recommended, orange checkmarks, orange subscribe button. SF Mono for prices.

- [ ] **Step 2: Update prep-sheet**

Table layout with SF Mono quantities. Steel row separators.

- [ ] **Step 3: Update legal + not-found**

Simple palette swap — steel background, DM Sans text.

- [ ] **Step 4: Commit**

```bash
git add app/paywall.tsx app/prep-sheet.tsx app/privacy.tsx app/terms.tsx "app/+not-found.tsx" && git commit -m "feat: update paywall, prep sheet, legal screens to Brushed Steel"
```

---

## Task 12: Final Polish + Cleanup + Version Bump

**Files:**
- Modify: `package.json` (remove unused deps)
- Modify: `app.json` (version bump)
- All files: final color sweep

- [ ] **Step 1: Remove unused dependencies**

```bash
npm uninstall drizzle-orm drizzle-zod drizzle-kit pg
```

Only remove if confirmed they're not imported anywhere in client code.

- [ ] **Step 2: Search for remaining hardcoded old colors**

```bash
grep -rn "#0A0A0A\|#141414\|#1E1E1E\|#D97706\|#B45309\|#F59E0B\|#0F172A\|rgba(255,255,255,0.08)\|rgba(255,255,255,0.12)" app/ components/ constants/ --include="*.tsx" --include="*.ts"
```

Replace with theme references.

- [ ] **Step 3: Verify no Inter_ references remain**

```bash
grep -rn "Inter_" app/ components/ constants/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

All 76 tests should pass. Update any that reference font names.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: final polish — remove old colors, unused deps, clean sweep"
```
