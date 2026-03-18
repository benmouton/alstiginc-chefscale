import { type RecipeWithDetails } from './database';
import { scaleAmount, convertUnit, formatQuantity, getUnitAbbreviation } from './scaling';

export interface PrepSheetRecipe {
  recipe: RecipeWithDetails;
  multiplier: number;
}

export interface AggregatedIngredient {
  name: string;
  amount: number;
  unit: string;
  display: string;
  sources: string[]; // recipe names
}

export function buildPrepSheet(selections: PrepSheetRecipe[]): AggregatedIngredient[] {
  // For each recipe, scale all ingredients by multiplier
  // Group by normalized ingredient name + compatible unit
  // Sum quantities (convert to common unit when possible)
  // Return sorted alphabetically

  const map = new Map<string, { amount: number; unit: string; sources: Set<string> }>();

  for (const { recipe, multiplier } of selections) {
    const targetServings = recipe.baseServings * multiplier;

    for (const ing of recipe.ingredients) {
      const scaled = scaleAmount(
        ing.amount,
        recipe.baseServings,
        targetServings,
        ing.unit,
        ing.isScalable !== 0
      );

      const key = ing.name.toLowerCase().trim();
      const existing = map.get(key);

      if (existing) {
        // Try to convert to same unit
        if (existing.unit === scaled.unit) {
          existing.amount += scaled.amount;
        } else {
          const converted = convertUnit(scaled.amount, scaled.unit, existing.unit);
          if (converted !== null) {
            existing.amount += converted;
          } else {
            // Can't convert — create separate entry with unit suffix
            const altKey = `${key}__${scaled.unit}`;
            const altExisting = map.get(altKey);
            if (altExisting) {
              altExisting.amount += scaled.amount;
              altExisting.sources.add(recipe.name);
            } else {
              map.set(altKey, { amount: scaled.amount, unit: scaled.unit, sources: new Set([recipe.name]) });
            }
            continue;
          }
        }
        existing.sources.add(recipe.name);
      } else {
        map.set(key, { amount: scaled.amount, unit: scaled.unit, sources: new Set([recipe.name]) });
      }
    }
  }

  return Array.from(map.entries())
    .map(([key, val]) => ({
      name: key.replace(/__.*$/, '').replace(/\b\w/g, (c) => c.toUpperCase()),
      amount: Math.round(val.amount * 100) / 100,
      unit: val.unit,
      display: `${formatQuantity(val.amount)} ${getUnitAbbreviation(val.unit)}`,
      sources: Array.from(val.sources),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function formatPrepSheetText(ingredients: AggregatedIngredient[], title: string): string {
  const lines = [`PREP SHEET: ${title}`, `Generated: ${new Date().toLocaleDateString()}`, ''];
  for (const ing of ingredients) {
    lines.push(`${ing.display}  ${ing.name}`);
    if (ing.sources.length > 1) {
      lines.push(`  (${ing.sources.join(', ')})`);
    }
  }
  return lines.join('\n');
}
