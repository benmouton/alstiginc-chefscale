# ChefScale

## Overview
ChefScale is a React Native recipe scaling app built with Expo for professional kitchens. It allows users to create, manage, and scale recipes with ingredient quantity adjustments, cost calculations, and allergen detection. Dark mode is the default for kitchen environments.

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
  _layout.tsx         - Root layout with fonts, providers, initDatabase()
components/
  RecipeCard.tsx      - Recipe list card
  ScalingControls.tsx - Serving adjuster with presets
  IngredientRow.tsx   - Scaled ingredient display
  InstructionStep.tsx - Numbered instruction step
  CostSummary.tsx     - Cost breakdown card
  NutritionCard.tsx   - Nutrition info display
  AllergenBadge.tsx   - Allergen warning badges
lib/
  database.ts         - SQLite CRUD operations (versioned schema, v2)
  scaling.ts          - Scaling math and unit conversions
  costs.ts            - Cost calculations (uses costPerUnit/costUnit)
  allergens.ts        - Allergen detection from ingredient names
store/
  useRecipeStore.ts   - Zustand store: recipes, currentRecipe, currentScale, prices, CRUD + query actions
constants/
  theme.ts            - Colors, spacing, typography tokens
  units.ts            - Unit conversion tables
  allergens.ts        - Allergen keyword lists
  colors.ts           - Legacy color export
```

## Database Schema (v2)
- **recipes**: id, name, description, category, tags (JSON string), baseServings, baseYieldUnit, prepTime, cookTime, imageUri, notes, source, isFavorite, createdAt, updatedAt
- **ingredients**: id, recipeId (FK), name, amount, unit, category, costPerUnit, costUnit, fdcId, isOptional, isScalable, prepNote, sortOrder
- **instructions**: id, recipeId (FK), stepNumber, text, timerMinutes, temperature, sortOrder
- **ingredient_prices**: id, ingredientName (unique, lowercase), costPerUnit, costUnit, purchaseUnit, purchaseCost, updatedAt
- Database initialized via initDatabase() in _layout.tsx on app launch
- Schema versioned via PRAGMA user_version (currently v2)

## Design
- Dark mode default (kitchen-friendly)
- Primary: Deep teal #0D9488
- Accent: Warm amber #F59E0B
- Background: #0F172A (dark), #1E293B (cards)
- Text: #F8FAFC (primary), #94A3B8 (secondary)
- Large touch targets (48px minimum)
- Liquid glass tab support for iOS 26+
- Categories: Entrée, Appetizer, Sauce, Dessert, Prep, Side, Beverage

## Key Field Renames (v1 → v2)
- recipes.servings → recipes.baseServings
- ingredients.quantity → ingredients.amount
- ingredient_prices: price/quantity/unit/store → costPerUnit/costUnit/purchaseUnit/purchaseCost

## Recent Changes
- Phase 2: Database schema upgrade to v2 with expanded fields
  - Added tags, baseYieldUnit, source, isFavorite to recipes
  - Added category, costPerUnit, costUnit, fdcId, isOptional, isScalable, prepNote to ingredients
  - Added timerMinutes, temperature, sortOrder to instructions
  - Restructured ingredient_prices for costPerUnit model
- Added query functions: searchRecipes, getRecipesByCategory, getRecipesByAllergenFree, getFavoriteRecipes
- Store expanded with currentRecipe, currentScale, toggleFavorite
- initDatabase() called on app launch in _layout.tsx
- Categories: Entrée, Appetizer, Sauce, Dessert, Prep, Side, Beverage
