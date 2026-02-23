# ChefScale

## Overview
ChefScale is a React Native recipe scaling app built with Expo. It allows users to create, manage, and scale recipes with ingredient quantity adjustments, cost calculations, and allergen detection.

## Tech Stack
- **Frontend**: Expo SDK 54, Expo Router (file-based navigation), TypeScript (strict mode)
- **State Management**: Zustand
- **Local Storage**: Expo SQLite (offline-first)
- **Styling**: StyleSheet with theme constants (dark mode by default)
- **Font**: Inter (Google Fonts)
- **Backend**: Express server on port 5000 (landing page + API)

## Project Structure
```
app/
  (tabs)/
    _layout.tsx       - Tab navigation (Recipes, Prices, Add, Settings)
    index.tsx         - Home screen (Recipe List)
    prices.tsx        - Ingredient price manager
    add.tsx           - Redirect tab to recipe/edit
    settings.tsx      - Settings screen
  recipe/
    [id].tsx          - Recipe Detail with scaling, cost, allergens
    edit.tsx          - Add/Edit Recipe (modal)
  _layout.tsx         - Root layout with fonts, providers
components/
  RecipeCard.tsx      - Recipe list card
  ScalingControls.tsx - Serving adjuster with presets
  IngredientRow.tsx   - Scaled ingredient display
  InstructionStep.tsx - Numbered instruction step
  CostSummary.tsx     - Cost breakdown card
  NutritionCard.tsx   - Nutrition info display
  AllergenBadge.tsx   - Allergen warning badges
lib/
  database.ts         - SQLite CRUD operations
  scaling.ts          - Scaling math and unit conversions
  costs.ts            - Cost calculations
  allergens.ts        - Allergen detection from ingredient names
store/
  useRecipeStore.ts   - Zustand store for recipes + prices
constants/
  theme.ts            - Colors, spacing, typography tokens
  units.ts            - Unit conversion tables
  allergens.ts        - Allergen keyword lists
  colors.ts           - Legacy color export
```

## Design
- Dark mode default (kitchen-friendly)
- Primary: Deep teal #0D9488
- Accent: Warm amber #F59E0B
- Background: #0F172A (dark), #1E293B (cards)
- Text: #F8FAFC (primary), #94A3B8 (secondary)
- Large touch targets (48px minimum)
- Liquid glass tab support for iOS 26+

## Recent Changes
- Initial project setup with full structure (Phase 1)
- SQLite database with recipes, ingredients, instructions, prices tables
- Zustand store with full CRUD operations
- Unit conversion system with US/metric support
- Allergen detection from 9 major allergen categories
- Cost calculation engine with per-serving breakdown
