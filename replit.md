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

## API Endpoints (server/routes.ts)
- **POST /api/ocr-recipe**: Accepts `{ imageBase64 }`, uses GPT-4o vision to extract recipe data from photo, returns structured JSON
- **POST /api/validate-recipe**: Accepts `{ name, ingredients, instructions }`, uses GPT-4o to analyze recipe completeness, returns `{ isComplete, suggestedSteps, warnings, tips }`

## Recent Changes
- Added AI recipe validation system:
  - POST /api/validate-recipe endpoint for AI-powered completeness analysis
  - Local validation: checks if all ingredients are referenced in instructions
  - Review modal: shows warnings, AI suggestions with accept/dismiss, pro tips
  - Dual save flow: "Review & Save" (runs validation) or "Save without review" (quick save)
  - Accepted AI suggestions auto-inserted into instructions at specified positions
- OCR recipe scanning via camera → GPT-4o vision → pre-fills all recipe fields
- Phase 2: Database schema upgrade to v2 with expanded fields
  - Added tags, baseYieldUnit, source, isFavorite to recipes
  - Added category, costPerUnit, costUnit, fdcId, isOptional, isScalable, prepNote to ingredients
  - Added timerMinutes, temperature, sortOrder to instructions
  - Restructured ingredient_prices for costPerUnit model
- Added query functions: searchRecipes, getRecipesByCategory, getRecipesByAllergenFree, getFavoriteRecipes
- Store expanded with currentRecipe, currentScale, toggleFavorite
- initDatabase() called on app launch in _layout.tsx
- Categories: Entrée, Appetizer, Sauce, Dessert, Prep, Side, Beverage
- Phase 3: Multi-photo support
  - Database v3: recipe_photos table (id, recipeId, uri, caption, sortOrder), photoUri on instructions
  - Edit screen: gallery photo management (add/remove/caption), instruction step photos (camera icon)
  - Detail screen: horizontal photo gallery section, inline step photos in InstructionStep component
  - Photo picker via expo-image-picker (camera + library), JPEG 0.7 quality
- Phase 5: Recipe Detail & Scaling (the killer feature)
  - Scaling thresholds: 48+ tsp→cups (direct), 16+ tbsp→cups (direct), 3+ tsp→tbsp (fallback), 4+ cups→quarts, 4+ quarts→gallons, 16+ oz→lbs
  - Down-conversions: <0.25 cup→tbsp, <1 tbsp→tsp
  - Fraction display: ¼, ⅓, ½, ¾, ⅛, ⅝, etc.
  - Smart rounding: whole numbers for "each" items, nearest ¼ for cups, nearest ½ for tbsp/tsp
  - CostSummary: food cost % with color coding (green <25%, yellow 25-30%, red >30%), "Edit Prices" link → prices tab
  - TimerOverlay component: countdown timer modal with start/pause/reset, visual progress fill, haptic feedback on completion
  - Ingredient category dividers: groups ingredients by category with labeled divider lines
  - Allergen section: "Contains:" label with colored badges for Big 9 allergens
  - Cook Mode button placeholder (coming in future phase)
  - Bottom actions: Cook Mode, Duplicate Recipe, Delete Recipe (with confirmation)
