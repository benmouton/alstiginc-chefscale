import { ALLERGENS, type AllergenInfo } from '@/constants/allergens';

export function detectAllergens(ingredientNames: string[]): AllergenInfo[] {
  const detected = new Set<string>();

  for (const name of ingredientNames) {
    const lower = name.toLowerCase().trim();
    for (const allergen of ALLERGENS) {
      if (detected.has(allergen.id)) continue;
      for (const keyword of allergen.keywords) {
        if (lower.includes(keyword)) {
          detected.add(allergen.id);
          break;
        }
      }
    }
  }

  return ALLERGENS.filter((a) => detected.has(a.id));
}

export function getAllergenById(id: string): AllergenInfo | undefined {
  return ALLERGENS.find((a) => a.id === id);
}
