import { ALLERGENS, type AllergenInfo, type AllergenConfidence } from '@/constants/allergens';

export interface DetectedAllergen {
  allergen: AllergenInfo;
  confidence: AllergenConfidence;
  matchedKeyword: string;
}

export function detectAllergensWithConfidence(ingredientNames: string[]): DetectedAllergen[] {
  const detected = new Map<string, DetectedAllergen>();

  for (const name of ingredientNames) {
    const lower = name.toLowerCase().trim();
    for (const allergen of ALLERGENS) {
      for (const keyword of allergen.keywords) {
        if (!lower.includes(keyword)) continue;

        // Determine confidence from classifiedKeywords
        let confidence: AllergenConfidence = 'major'; // default if not classified
        const classified = allergen.classifiedKeywords.find((ck) => lower.includes(ck.term));
        if (classified) {
          confidence = classified.confidence;
        }

        const existing = detected.get(allergen.id);
        if (!existing || (existing.confidence === 'trace' && confidence === 'major')) {
          detected.set(allergen.id, { allergen, confidence, matchedKeyword: keyword });
        }
        break;
      }
    }
  }

  return Array.from(detected.values());
}

export function detectAllergens(ingredientNames: string[]): AllergenInfo[] {
  return detectAllergensWithConfidence(ingredientNames).map((d) => d.allergen);
}

export function getAllergenById(id: string): AllergenInfo | undefined {
  return ALLERGENS.find((a) => a.id === id);
}
