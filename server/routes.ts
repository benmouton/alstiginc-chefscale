import type { Express } from "express";
import { createServer, type Server } from "node:http";
import express from "express";
import OpenAI from "openai";

const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

console.log("[OpenAI] API key present:", !!apiKey, apiKey ? `(starts with: ${apiKey.substring(0, 8)}...)` : "");
console.log("[OpenAI] Base URL:", baseURL || "NOT SET");

const openai = new OpenAI({
  apiKey,
  baseURL,
  timeout: 30000,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/ocr-recipe", async (req, res) => {
    const startTime = Date.now();
    console.log("[OCR] === OCR REQUEST RECEIVED ===");
    console.log("[OCR] Body size:", JSON.stringify(req.body || {}).length, "bytes");
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        console.log("[OCR] ERROR: Missing imageBase64 in request body");
        return res.status(400).json({ error: "imageBase64 is required" });
      }
      console.log("[OCR] Image base64 length:", imageBase64.length, "chars (~" + Math.round(imageBase64.length * 0.75 / 1024) + "KB)");
      console.log("[OCR] Sending to OpenAI (model: gpt-4o, timeout: 30s)...");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a recipe extraction assistant. Analyze the image of a recipe (handwritten or typed) and extract all information into structured JSON. Return ONLY valid JSON with this exact structure:
{
  "name": "recipe name",
  "description": "brief description",
  "category": "one of: Entrée, Appetizer, Sauce, Dessert, Prep, Side, Beverage, Other",
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
Valid units: tsp, tbsp, cup, fl_oz, oz, lb, g, kg, ml, l, each, pinch, bunch, can, bottle, clove, sprig, head, stalk, piece.
If you cannot determine a value, use reasonable defaults. Extract as much as possible from the image.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
              {
                type: "text",
                text: "Extract the recipe from this image into the JSON format specified.",
              },
            ],
          },
        ],
        max_completion_tokens: 4096,
      });

      const elapsed = Date.now() - startTime;
      console.log("[OCR] OpenAI responded in", elapsed + "ms");
      const content = response.choices[0]?.message?.content || "";
      console.log("[OCR] Response content length:", content.length, "chars");

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log("[OCR] ERROR: No JSON found in response. Content:", content.substring(0, 200));
        return res.status(422).json({ error: "Could not extract recipe from image" });
      }

      const recipe = JSON.parse(jsonMatch[0]);
      console.log("[OCR] SUCCESS: Extracted recipe:", recipe.name || "unnamed");
      res.json(recipe);
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error("[OCR] FAILED after", elapsed + "ms");
      console.error("[OCR] Error name:", error?.name);
      console.error("[OCR] Error message:", error?.message);
      console.error("[OCR] Error status:", error?.status);
      console.error("[OCR] Full error:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: error?.message || "Failed to process recipe image" });
    }
  });

  app.post("/api/validate-recipe", async (req, res) => {
    try {
      const { name, ingredients, instructions } = req.body;
      if (!name || !ingredients?.length || !instructions?.length) {
        return res.status(400).json({ error: "name, ingredients, and instructions are required" });
      }

      const ingredientList = ingredients.map((i: any) =>
        `- ${i.amount} ${i.unit} ${i.name}${i.prepNote ? ` (${i.prepNote})` : ""}`
      ).join("\n");

      const stepList = instructions.map((s: any, idx: number) =>
        `${idx + 1}. ${s.text}${s.timerMinutes ? ` [${s.timerMinutes} min]` : ""}${s.temperature ? ` [${s.temperature}]` : ""}`
      ).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional chef and recipe editor. Analyze this recipe for completeness and accuracy. Return ONLY valid JSON with this exact structure:
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
- If everything looks complete, set isComplete to true and leave suggestedSteps and warnings empty.`,
          },
          {
            role: "user",
            content: `Recipe: ${name}\n\nIngredients:\n${ingredientList}\n\nInstructions:\n${stepList}\n\nAre there any missing steps in this recipe? Are all ingredients accounted for? Suggest any additions needed for a complete, professional recipe.`,
          },
        ],
        max_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(422).json({ error: "Could not analyze recipe" });
      }

      const result = JSON.parse(jsonMatch[0]);
      res.json(result);
    } catch (error) {
      console.error("Validate recipe error:", error);
      res.status(500).json({ error: "Failed to validate recipe" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
