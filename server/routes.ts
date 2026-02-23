import type { Express } from "express";
import { createServer, type Server } from "node:http";
import express from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/ocr-recipe", express.json({ limit: "20mb" }), async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
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

      const content = response.choices[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(422).json({ error: "Could not extract recipe from image" });
      }

      const recipe = JSON.parse(jsonMatch[0]);
      res.json(recipe);
    } catch (error) {
      console.error("OCR recipe error:", error);
      res.status(500).json({ error: "Failed to process recipe image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
