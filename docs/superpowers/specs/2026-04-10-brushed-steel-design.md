# ChefScale UI Redesign — "Brushed Steel"

**Date:** 2026-04-10
**Status:** Design approved
**Scope:** Full redesign, all screens, one release

## Design Direction

Professional kitchen instrument. Cool blue-gray steel surfaces with embossed depth, orange operational accent, monospace numbers for precision. ChefScale should feel like a commercial kitchen tool — not a consumer app, not another dark-mode AI product. Every element earns its screen space.

Key inspirations: Bloomberg Terminal (data density), commercial kitchen equipment (stainless steel, high contrast labels), professional POS systems (monospace numbers, utility-first).

## Color Palette (Dark Mode Only)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#2a2d32` | App background — brushed steel |
| `backgroundDeep` | `#22252a` | Deeper surfaces, tab bar |
| `card` | `#32363b` | Cards, elevated surfaces — polished steel |
| `cardBorder` | `#3a3d42` | Card borders — steel edge |
| `primary` | `#f97316` | Orange accent — operational signal |
| `primaryDark` | `#ea580c` | Pressed orange |
| `primaryLight` | `#fb923c` | Hover/highlight orange |
| `text` | `#e8eaed` | Primary text — bright steel white |
| `textSecondary` | `#8a8d92` | Secondary — brushed gray |
| `textTertiary` | `#52525b` | Tertiary — recessed steel |
| `inputBg` | `#282b30` | Text inputs |
| `border` | `#3a3d42` | Borders, dividers |
| `danger` | `#ef4444` | Delete, destructive |
| `success` | `#22c55e` | Cost indicators, positive values |
| `warning` | `#f59e0b` | Warnings, approaching thresholds |
| `accentInactive` | `#282b30` | Inactive segments |
| `overlay` | `rgba(0,0,0,0.6)` | Modal overlays |
| `innerHighlight` | `rgba(255,255,255,0.04)` | Card inner top edge highlight |
| `dropShadow` | `rgba(0,0,0,0.2)` | Card bottom shadow |

### Category Colors (unchanged, used for badges + ticket rails)
| Category | Color |
|----------|-------|
| Entrée | `#f97316` (orange) |
| Appetizer | `#ef4444` (red) |
| Sauce | `#f97316` (orange) |
| Dessert | `#ec4899` (pink) |
| Prep | `#0d9488` (teal) |
| Side | `#22c55e` (green) |
| Beverage | `#7c3aed` (purple) |

## Typography

Replace Inter with **DM Sans** (`@expo-google-fonts/dm-sans`) for all text. Use **SF Mono** (system, no install needed) for all numerical data.

| Role | Font | Weight | Size | Usage |
|------|------|--------|------|-------|
| Title | DM Sans | 700 | 20-28px | Screen titles, recipe names |
| Card Title | DM Sans | 600 | 15-16px | Card headers, section labels |
| Body | DM Sans | 400 | 14-15px | Descriptions, ingredient names |
| Label | DM Sans | 700 | 9-11px | ALL-CAPS labels, category badges, tab labels. Letter-spacing 1-2px |
| Number | SF Mono | 700 | 14-20px | Costs, percentages, servings, measurements, conversions |
| Number Small | SF Mono | 600 | 11-13px | Inline metrics, food cost % |

Font families to register:
- `DMSans_400Regular`
- `DMSans_500Medium`
- `DMSans_600SemiBold`
- `DMSans_700Bold`

SF Mono: Use `Platform.OS === 'ios' ? 'SF Mono' : 'monospace'` — no package needed.

## Component Design

### Recipe Cards (RecipeCard.tsx)

Current: 200px height horizontal scroll cards with gradient overlays.

New design:
- Vertical list cards (not horizontal scroll) — data density over visual splash
- Embossed steel panel: `background: linear-gradient(145deg, #32363b, #2a2d32)`, `border: 1px solid #3a3d42`, `box-shadow` inner highlight + drop shadow
- Left accent stripe (4px) colored by category
- Recipe name left, cost/serving right-aligned in SF Mono
- Metadata row: category badge (bordered pill), servings, time, food cost %
- Allergen dots below metadata
- Border radius: 10px
- Press: scale(0.98) with 100ms timing (crisp, not springy)

### GlassCard → SteelCard

Rename `GlassCard` to `SteelCard`. Replace frosted glass with embossed steel:
- Background: `linear-gradient(145deg, card, background)`
- Border: `1px solid cardBorder`
- Inner highlight: `inset 0 1px 0 rgba(255,255,255,0.04)`
- Drop shadow: `0 2px 4px rgba(0,0,0,0.2)`
- Padding: 14px, border-radius: 10px

### Segmented Control

Current: Glass-style pills.

New design:
- Container: `background: backgroundDeep`, `border: 1px solid cardBorder`, `borderRadius: 8px`, `padding: 2px`
- Active: `background: primary` (orange), `color: #000`, `fontWeight: 700`
- Inactive: `color: textTertiary`
- No animation — instant snap (crisp tool feel)

### Stats Dashboard (Home Screen)

New element — two stat tiles at top of recipe list:
- "AVG FOOD COST" → value in SF Mono, colored green/yellow/red by threshold
- "AVG COST/SRV" → value in SF Mono
- Same embossed steel card style

### ScalingControls

Current: Serving multiplier buttons with premium gate.

New design:
- Compact horizontal layout: `[−] 6 srv [+]`
- Numbers in SF Mono
- Steel button backgrounds with embossed style
- Quick multiplier chips: 0.5x, 1x, 2x, 4x (steel pills)
- Orange active state on selected multiplier

### CostSummary

Current: Shows total cost, per-serving cost, food cost %.

New design:
- SF Mono for all dollar amounts and percentages
- Food cost % with color coding: green (<30%), yellow (30-35%), red (>35%)
- Menu price calculator uses same monospace treatment
- Compact grid layout, no decorative elements

### Tab Bar

Current: BlurView on iOS, solid on fallback.

New design:
- Background: `backgroundDeep` (#22252a) with top border
- Active: orange icon + label
- Inactive: `textTertiary`
- NativeTabs on iOS 26+ (unchanged)
- Labels: DM Sans 700, 9px, letter-spacing 1px, uppercase

## Screen-Specific Updates

### 1. Home (tabs/index.tsx)
- Background: `background` (#2a2d32)
- Stats dashboard tiles at top (avg food cost, avg cost/srv)
- Segmented filter below stats
- Vertical recipe card list (replacing horizontal scroll)
- Empty state: orange tinted icon, steel CTA button

### 2. Recipe Detail (recipe/[id].tsx)
- Steel background, no gradient overlays on hero area
- Category badge with colored border, not gradient fill
- Scaling controls: steel buttons, SF Mono numbers
- Ingredient list: amount in SF Mono (left), name in DM Sans (right)
- Cost summary: all numbers in SF Mono with color-coded food cost %
- Section headers: DM Sans 700, 9px, uppercase, letter-spacing 2px, `textSecondary`
- Cook Mode button: orange, full-width, DM Sans 700

### 3. Prices (tabs/prices.tsx)
- Steel card per ingredient
- Price in SF Mono right-aligned
- Unit in `textSecondary`
- Search bar: steel input with orange focus border

### 4. Converter (tabs/converter.tsx)
- Large SF Mono numbers for input/output values
- Preset buttons: steel pills with orange active
- Unit pickers: steel dropdown style
- Result: large SF Mono with unit label

### 5. Settings (tabs/settings.tsx)
- Grouped steel sections
- Section headers: uppercase, letter-spaced, `textSecondary`
- Toggle switches: orange active
- Version: read from Constants, not hardcoded

### 6. Add/Edit Recipe (recipe/edit.tsx)
- Steel input fields with orange focus border
- Section dividers between form groups
- Save button: orange, full-width
- Ingredient rows: steel cards with inline editing

### 7. Cook Mode (recipe/cook-mode.tsx)
- Deep background (#22252a) for focus
- Large DM Sans text for current step
- Timer: SF Mono digits, large
- Step progress: orange progress bar

### 8. Paywall (paywall.tsx)
- Steel cards for plan options
- Orange border on recommended plan
- Feature checkmarks: orange
- Subscribe button: orange gradient

### 9. Prep Sheet (prep-sheet.tsx)
- Table-like layout with SF Mono quantities
- Steel row separators
- Print-ready clean layout

### 10. Privacy/Terms
- Steel background, DM Sans text, simple

## Animations (react-native-reanimated)

### Press Interactions
- Scale: `withTiming(0.98, { duration: 100 })` — NOT spring, crisp timing
- Opacity: 0.9 on press
- Haptic: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`

### Number Transitions
- When serving count changes: animate number with `withTiming` fade (150ms)
- When cost values update: roll/fade transition (not instant snap)
- Converter result: fade-in on new value

### No decorative animation
- No staggered list entrance (too playful for a tool)
- No parallax
- No bouncy springs
- Tab switches: instant

## Files to Modify

### Core
1. `constants/theme.ts` — new Brushed Steel palette
2. `constants/colors.ts` — sync with theme
3. `app/_layout.tsx` — load DM Sans, remove Inter
4. `app/(tabs)/_layout.tsx` — tab bar styling

### Components
5. `components/GlassCard.tsx` → rename to `SteelCard.tsx`
6. `components/RecipeCard.tsx` — vertical list card with accent stripe
7. `components/ScalingControls.tsx` — steel buttons, SF Mono
8. `components/CostSummary.tsx` — SF Mono numbers, color-coded FC%
9. `components/NutritionCard.tsx` — steel palette
10. `components/AllergenBadge.tsx` — steel border style
11. `components/AllergenList.tsx` — updated styling
12. `components/PremiumGate.tsx` — steel overlay
13. `components/ProBadge.tsx` — orange badge
14. `components/MyCookbookPromo.tsx` — steel card
15. `components/IngredientRow.tsx` — SF Mono amounts
16. `components/InstructionStep.tsx` — steel styling
17. `components/TimerOverlay.tsx` — SF Mono timer

### Screens
18. `app/(tabs)/index.tsx` — stats dashboard, vertical list
19. `app/(tabs)/prices.tsx` — steel cards, SF Mono prices
20. `app/(tabs)/converter.tsx` — SF Mono values, steel presets
21. `app/(tabs)/settings.tsx` — grouped steel sections
22. `app/(tabs)/add.tsx` — fix stale background color
23. `app/recipe/[id].tsx` — detail overhaul
24. `app/recipe/edit.tsx` — form steel styling
25. `app/recipe/cook-mode.tsx` — focused cooking UI
26. `app/paywall.tsx` — steel plans
27. `app/prep-sheet.tsx` — table layout
28. `app/privacy.tsx` — steel text
29. `app/terms.tsx` — steel text

### New Dependencies
30. `@expo-google-fonts/dm-sans`

### Also Fix (from audit)
31. `app/(tabs)/settings.tsx` — hardcoded version "1.0.0" → read from Constants
32. `app/(tabs)/converter.tsx` — already fixed preset label
33. Remove unused dependencies (drizzle-orm, pg, openai from client)

## Design Principles

1. **Data density over decoration.** Every pixel shows useful information. No gradient fills for aesthetics.
2. **Numbers are first-class.** Costs, percentages, measurements — all in SF Mono, prominently placed. This is a financial tool for food.
3. **Steel, not black.** The blue-gray palette separates ChefScale from every dark-mode app. Embossed card surfaces add depth without gradients.
4. **Orange means action.** Orange is the operational signal — CTAs, active states, category highlights. Everything else is steel.
5. **Crisp, not bouncy.** Animations use timing curves, not springs. Tools respond instantly. No playful motion.
6. **Category colors are data.** Entrée orange, sauce green, dessert pink — these communicate, they don't decorate.
7. **Pro kitchen identity.** This app sits next to a POS terminal and a kitchen timer. It should feel like it belongs there.
