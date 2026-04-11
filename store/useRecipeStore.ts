import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import {
  getAllRecipes,
  getRecipeWithDetails,
  insertRecipe,
  updateRecipe,
  deleteRecipe as dbDeleteRecipe,
  insertIngredient,
  deleteIngredientsByRecipeId,
  insertInstruction,
  deleteInstructionsByRecipeId,
  insertRecipePhoto,
  deleteRecipePhotosByRecipeId,
  getAllPrices,
  upsertPrice,
  deletePrice as dbDeletePrice,
  searchRecipes as dbSearchRecipes,
  getRecipesByCategory as dbGetRecipesByCategory,
  getRecipesByAllergenFree as dbGetRecipesByAllergenFree,
  getFavoriteRecipes as dbGetFavoriteRecipes,
  toggleFavorite as dbToggleFavorite,
  clearAllData as dbClearAllData,
  getVariationsByParentId,
  getRecipeBasicById,
  getDatabase,
  type RecipeRow,
  type IngredientRow,
  type InstructionRow,
  type RecipePhotoRow,
  type IngredientPriceRow,
  type RecipeWithDetails,
} from '@/lib/database';

export type Recipe = RecipeWithDetails;

interface RecipeStore {
  recipes: RecipeRow[];
  currentRecipe: Recipe | null;
  currentScale: number;
  prices: IngredientPriceRow[];
  isLoading: boolean;
  error: string | null;

  loadRecipes: () => Promise<void>;
  loadRecipeDetail: (id: string) => Promise<Recipe | null>;
  saveRecipe: (recipe: Omit<Recipe, 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;

  setCurrentScale: (scale: number) => void;
  resetScale: () => void;

  searchRecipes: (query: string) => Promise<RecipeRow[]>;
  getRecipesByCategory: (category: string) => Promise<RecipeRow[]>;
  getRecipesByAllergenFree: (allergenKeywords: string[]) => Promise<RecipeRow[]>;
  getFavoriteRecipes: () => Promise<RecipeRow[]>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;

  loadPrices: () => Promise<void>;
  savePrice: (price: Omit<IngredientPriceRow, 'updatedAt'>) => Promise<void>;
  removePrice: (id: string) => Promise<void>;

  clearAllData: () => Promise<void>;

  getVariations: (recipeId: string) => Promise<RecipeRow[]>;
  getRecipeBasic: (id: string) => Promise<{id: string, name: string, baseServings: number, baseYieldUnit: string} | null>;

  generateId: () => string;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  currentRecipe: null,
  currentScale: 1,
  prices: [],
  isLoading: false,
  error: null,

  loadRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const recipes = await getAllRecipes();
      set({ recipes, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  loadRecipeDetail: async (id: string) => {
    try {
      const recipe = await getRecipeWithDetails(id);
      if (!recipe) return null;
      set({ currentRecipe: recipe });
      return recipe;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  saveRecipe: async (recipe) => {
    try {
      const existing = get().recipes.find((r) => r.id === recipe.id);

      if (existing) {
        await updateRecipe(recipe);
      } else {
        await insertRecipe(recipe);
      }

      await deleteIngredientsByRecipeId(recipe.id);
      for (const ing of recipe.ingredients) {
        await insertIngredient(ing);
      }

      await deleteInstructionsByRecipeId(recipe.id);
      for (const inst of recipe.instructions) {
        await insertInstruction(inst);
      }

      await deleteRecipePhotosByRecipeId(recipe.id);
      if (recipe.photos) {
        for (const photo of recipe.photos) {
          await insertRecipePhoto(photo);
        }
      }

      // Auto-populate ingredient_prices for new ingredients
      const db = await getDatabase();
      for (const ing of recipe.ingredients) {
        const name = ing.name.trim();
        if (name) {
          const existing = await db.getFirstAsync(
            'SELECT id FROM ingredient_prices WHERE LOWER(ingredientName) = LOWER(?)',
            [name]
          );
          if (!existing) {
            await db.runAsync(
              'INSERT INTO ingredient_prices (id, ingredientName, costPerUnit, costUnit) VALUES (?, ?, NULL, ?)',
              [Crypto.randomUUID(), name, ing.unit || '']
            );
          }
        }
      }

      await get().loadRecipes();
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  removeRecipe: async (id: string) => {
    try {
      await dbDeleteRecipe(id);
      set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
        currentRecipe: state.currentRecipe?.id === id ? null : state.currentRecipe,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  setCurrentScale: (scale: number) => set({ currentScale: scale }),
  resetScale: () => set({ currentScale: 1 }),

  searchRecipes: async (query: string) => {
    try {
      return await dbSearchRecipes(query);
    } catch (e) {
      set({ error: (e as Error).message });
      return [];
    }
  },

  getRecipesByCategory: async (category: string) => {
    try {
      return await dbGetRecipesByCategory(category);
    } catch (e) {
      set({ error: (e as Error).message });
      return [];
    }
  },

  getRecipesByAllergenFree: async (allergenKeywords: string[]) => {
    try {
      return await dbGetRecipesByAllergenFree(allergenKeywords);
    } catch (e) {
      set({ error: (e as Error).message });
      return [];
    }
  },

  getFavoriteRecipes: async () => {
    try {
      return await dbGetFavoriteRecipes();
    } catch (e) {
      set({ error: (e as Error).message });
      return [];
    }
  },

  toggleFavorite: async (id: string, isFavorite: boolean) => {
    try {
      await dbToggleFavorite(id, isFavorite);
      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === id ? { ...r, isFavorite: isFavorite ? 1 : 0 } : r
        ),
        currentRecipe:
          state.currentRecipe?.id === id
            ? { ...state.currentRecipe, isFavorite: isFavorite ? 1 : 0 }
            : state.currentRecipe,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  loadPrices: async () => {
    try {
      const prices = await getAllPrices();
      set({ prices });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  savePrice: async (price) => {
    try {
      await upsertPrice(price);
      await get().loadPrices();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  removePrice: async (id: string) => {
    try {
      await dbDeletePrice(id);
      set((state) => ({
        prices: state.prices.filter((p) => p.id !== id),
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  clearAllData: async () => {
    try {
      await dbClearAllData();
      set({ recipes: [], prices: [], currentRecipe: null, currentScale: 1 });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  getVariations: async (recipeId: string) => {
    try {
      return await getVariationsByParentId(recipeId);
    } catch (e) {
      set({ error: (e as Error).message });
      return [];
    }
  },

  getRecipeBasic: async (id: string) => {
    try {
      return await getRecipeBasicById(id);
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  generateId: () => Crypto.randomUUID(),
}));
