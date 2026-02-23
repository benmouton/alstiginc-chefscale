import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import {
  getAllRecipes,
  getRecipeById,
  getIngredientsByRecipeId,
  getInstructionsByRecipeId,
  insertRecipe,
  updateRecipe,
  deleteRecipe as dbDeleteRecipe,
  insertIngredient,
  deleteIngredientsByRecipeId,
  insertInstruction,
  deleteInstructionsByRecipeId,
  getAllPrices,
  upsertPrice,
  deletePrice as dbDeletePrice,
  type RecipeRow,
  type IngredientRow,
  type InstructionRow,
  type IngredientPriceRow,
} from '@/lib/database';

export interface Recipe extends RecipeRow {
  ingredients: IngredientRow[];
  instructions: InstructionRow[];
}

interface RecipeStore {
  recipes: Recipe[];
  prices: IngredientPriceRow[];
  isLoading: boolean;
  error: string | null;

  loadRecipes: () => Promise<void>;
  loadRecipeDetail: (id: string) => Promise<Recipe | null>;
  saveRecipe: (recipe: Omit<Recipe, 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;

  loadPrices: () => Promise<void>;
  savePrice: (price: Omit<IngredientPriceRow, 'updatedAt'>) => Promise<void>;
  removePrice: (id: string) => Promise<void>;

  generateId: () => string;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  prices: [],
  isLoading: false,
  error: null,

  loadRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const rows = await getAllRecipes();
      const recipes: Recipe[] = rows.map((r) => ({
        ...r,
        ingredients: [],
        instructions: [],
      }));
      set({ recipes, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  loadRecipeDetail: async (id: string) => {
    try {
      const recipe = await getRecipeById(id);
      if (!recipe) return null;

      const ingredients = await getIngredientsByRecipeId(id);
      const instructions = await getInstructionsByRecipeId(id);

      const full: Recipe = { ...recipe, ingredients, instructions };

      set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ? full : r)),
      }));

      return full;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  saveRecipe: async (recipe) => {
    try {
      const existing = await getRecipeById(recipe.id);

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

      await get().loadRecipes();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  removeRecipe: async (id: string) => {
    try {
      await dbDeleteRecipe(id);
      set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
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

  generateId: () => Crypto.randomUUID(),
}));
