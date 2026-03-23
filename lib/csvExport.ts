import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { RecipeRow, IngredientRow, IngredientPriceRow } from './database';

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildRecipeCSV(
  recipes: RecipeRow[],
  getIngredients: (recipeId: string) => IngredientRow[]
): string {
  const header = 'Recipe,Category,Servings,Prep Time (min),Cook Time (min),Ingredient,Amount,Unit';
  const rows: string[] = [header];

  for (const recipe of recipes) {
    const ingredients = getIngredients(recipe.id);
    if (ingredients.length === 0) {
      rows.push([
        escapeCSV(recipe.name),
        escapeCSV(recipe.category),
        recipe.baseServings,
        recipe.prepTime,
        recipe.cookTime,
        '', '', '',
      ].join(','));
    } else {
      for (const ing of ingredients) {
        rows.push([
          escapeCSV(recipe.name),
          escapeCSV(recipe.category),
          recipe.baseServings,
          recipe.prepTime,
          recipe.cookTime,
          escapeCSV(ing.name),
          ing.amount,
          escapeCSV(ing.unit),
        ].join(','));
      }
    }
  }

  return rows.join('\n');
}

export function buildPriceCSV(prices: IngredientPriceRow[]): string {
  const header = 'Ingredient,Cost Per Unit,Cost Unit,Purchase Unit,Purchase Cost,Updated';
  const rows: string[] = [header];

  for (const p of prices) {
    rows.push([
      escapeCSV(p.ingredientName),
      p.costPerUnit ?? '',
      escapeCSV(p.costUnit),
      escapeCSV(p.purchaseUnit),
      p.purchaseCost ?? '',
      escapeCSV(p.updatedAt),
    ].join(','));
  }

  return rows.join('\n');
}

export async function shareCSV(csv: string, fileNamePrefix: string): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const fileName = `${fileNamePrefix}-${date}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const filePath = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(filePath, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Share.share({
      url: filePath,
      title: fileName,
    });
  }
}
