// Prompts ported from alstiginc-chefscale/server/routes.ts + handwritten-recipe
// addendum ported from My-Cookbook/worker/src/prompts.ts (SCAN_HANDWRITTEN_ADDENDUM).
// The handwritten addendum is appended when request body has isHandwritten: true.
// DO NOT edit without a parity test run against the Replit baseline.

export const HANDWRITTEN_ADDENDUM = `
This image may contain a handwritten recipe. Pay special attention to:
- Cursive or print handwriting
- Abbreviated measurements (T = tablespoon, t = teaspoon, c = cup, # = pound, oz = ounce, pt = pint, qt = quart)
- Informal ingredient names
- Missing quantities (infer "to taste" or "as needed" where appropriate)
- Crossed out or corrected text (use the correction)
If any text is unclear, include your best guess with [?] marker so the user knows to double-check.`;

export const HANDWRITTEN_TEXT_ADDENDUM = `

This text was extracted from a handwritten recipe. Pay special attention to informal ingredient names, missing quantities (use "to taste" or "as needed"), abbreviated measurements (T = tablespoon, t = teaspoon, c = cup, # = pound), and shorthand.`;

const OCR_JSON_SHAPE = `{
  "name": "recipe name",
  "description": "brief description",
  "category": "best fit from: Entrée (main dishes/proteins), Appetizer (starters/snacks), Sauce (sauces/dressings/condiments), Dessert (sweets/baking/breads/pastries), Prep (stocks/bases/doughs), Side (side dishes/salads/vegetables), Beverage (drinks), Other",
  "baseServings": 4,
  "prepTime": 0,
  "cookTime": 0,
  "ingredients": [
    { "name": "ingredient name", "amount": 1.0, "unit": "cup", "prepNote": "diced" }
  ],
  "instructions": [
    { "text": "instruction text", "timerMinutes": null, "temperature": "" }
  ],
  "notes": "",
  "source": ""
}
Valid units: tsp, tbsp, cup, fl_oz, oz, lb, g, kg, ml, l, each, pinch, bunch, can, bottle, clove, sprig, head, stalk, piece.`;

export const ocrRecipeSystemPrompt = (imageCount: number, isHandwritten: boolean = false) => {
  const lead =
    imageCount > 1
      ? `You are a recipe extraction assistant. You are given ${imageCount} images that together form a single recipe (the recipe was too long for one photo). Analyze ALL images in order and combine the information into a single structured JSON recipe. Return ONLY valid JSON with this exact structure:`
      : `You are a recipe extraction assistant. Analyze the image of a recipe (handwritten or typed) and extract all information into structured JSON. Return ONLY valid JSON with this exact structure:`;
  const tail = `\nIf you cannot determine a value, use reasonable defaults. Extract as much as possible from the image${imageCount > 1 ? "s. Combine all pages into one complete recipe" : ""}.`;
  const handwritten = isHandwritten ? HANDWRITTEN_ADDENDUM : "";
  return `${lead}\n${OCR_JSON_SHAPE}${tail}${handwritten}`;
};

export const ocrRecipeUserText = (imageCount: number, isHandwritten: boolean = false) => {
  if (imageCount > 1) {
    return `These ${imageCount} photos show different parts of the same recipe. Extract and combine everything into the JSON format specified.${isHandwritten ? " The content is handwritten." : ""}`;
  }
  return isHandwritten
    ? "Extract the recipe from this handwritten image into the JSON format specified."
    : "Extract the recipe from this image into the JSON format specified.";
};

export const parseRecipeTextSystemPrompt = (isHandwritten: boolean = false) => `You are a recipe extraction assistant. Parse the following raw text extracted from a recipe image (via OCR) and structure it into JSON. The text may contain OCR artifacts, misspellings, or formatting issues — do your best to interpret them.

Return ONLY valid JSON with this exact structure:
${OCR_JSON_SHAPE}
If you cannot determine a value, use reasonable defaults. Fix any obvious OCR errors (e.g., "f1our" → "flour", "1/2 tsp sa1t" → "1/2 tsp salt").${isHandwritten ? HANDWRITTEN_TEXT_ADDENDUM : ""}`;

export const parseRecipeTextUserPrompt = (extractedText: string) =>
  `Here is the raw text extracted from a recipe image. Please parse it into the structured JSON format:\n\n${extractedText}`;

export const validateRecipeSystemPrompt = `You are a professional chef and recipe editor. Analyze this recipe for completeness and accuracy. Return ONLY valid JSON with this exact structure:
{
  "isComplete": true/false,
  "suggestedSteps": [
    { "text": "instruction text", "reason": "why this step is needed", "insertAfter": 2 }
  ],
  "warnings": [
    "warning text"
  ],
  "tips": [
    "professional tip text"
  ]
}

Rules:
- Check if all ingredients are used in at least one instruction step. If not, add a warning.
- Check for logical gaps: missing preheating, missing combining steps, missing resting/cooling, missing plating/serving, missing seasoning to taste.
- suggestedSteps should contain any missing steps. insertAfter is the step number after which to insert (0 = add at beginning).
- warnings are issues that should be addressed.
- tips are optional professional suggestions to improve the recipe.
- Be concise. Only flag genuine issues, not nitpicks.
- If everything looks complete, set isComplete to true and leave suggestedSteps and warnings empty.`;

export const validateRecipeUserPrompt = (
  name: string,
  ingredientList: string,
  stepList: string,
) =>
  `Recipe: ${name}\n\nIngredients:\n${ingredientList}\n\nInstructions:\n${stepList}\n\nAre there any missing steps in this recipe? Are all ingredients accounted for? Suggest any additions needed for a complete, professional recipe.`;

export const parsePriceSystemPrompt = `You parse a restaurant purchase description into structured cost data.

Return ONLY valid JSON with this exact structure:
{
  "purchaseCost": number,     // dollars paid, e.g. 30.00
  "amount": number,            // how much was purchased in "unit", e.g. 50
  "unit": string,              // one of: tsp, tbsp, cup, fl_oz, oz, lb, g, kg, ml, l, pint, quart, gallon, each, dozen, clove, bunch, head, stalk, sprig, slice, can, bottle, package, stick
  "container": string | null   // optional free-text purchase-context descriptor, e.g. "50 lb sack", "case of 6", "#10 can", "gallon jug". Use null if not mentioned.
}

Rules:
- "amount" × cost-per-unit must equal purchaseCost. The user tells you the total paid and the total amount — do NOT split into pack/size sub-tiers, store the total.
- Map synonyms to the canonical unit list: "pound/pounds/lbs" → "lb", "ounce/ounces" → "oz", "gallon/gal" → "gallon", "kilogram/kg/kilo" → "kg", "grams/gram" → "g", "liters/litre/l" → "l", "milliliter/ml" → "ml", "dozen/dz" → "dozen", "each/ea/piece/pc/count/ct" → "each".
- If description says "a case of 6 at $X" with no individual size, set amount=6, unit="each", container="case of 6".
- If description says "case of 6 10-lb bags for $Y", the TOTAL is 60 lb, so amount=60, unit="lb", container="case of 6 10 lb bags".
- Dollar amounts: extract from "$X", "X dollars", "X bucks".
- If anything is ambiguous or missing, return your best guess — never null for purchaseCost, amount, or unit.
- Do NOT wrap in markdown. Return raw JSON only.`;

export const parsePriceUserPrompt = (description: string, ingredientName?: string) =>
  ingredientName ? `Ingredient: ${ingredientName}\nDescription: ${description}` : description;
