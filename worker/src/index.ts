import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";
import {
  ocrRecipeSystemPrompt,
  ocrRecipeUserText,
  parseRecipeTextSystemPrompt,
  parseRecipeTextUserPrompt,
  validateRecipeSystemPrompt,
  validateRecipeUserPrompt,
  parsePriceSystemPrompt,
  parsePriceUserPrompt,
} from "./prompts";

type Bindings = {
  OPENAI_API_KEY: string;
  AI_GATEWAY_BASE_URL?: string;
  OPENAI_MODEL_HEAVY: string;
  OPENAI_MODEL_LIGHT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (origin === "https://chef-scale.replit.app") return origin;
      if (origin.endsWith(".chefscale.alstiginc.com") || origin === "https://chefscale.alstiginc.com") return origin;
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) return origin;
      return null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 600,
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "chefscale-api" }));

function makeOpenAIClient(env: Bindings): OpenAI {
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL || undefined,
    timeout: 30000,
  });
}

function extractJsonBlock<T = unknown>(content: string): T | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

// ─── POST /api/ocr-recipe ────────────────────────────────────
app.post("/api/ocr-recipe", async (c) => {
  const env = c.env;
  if (!env.OPENAI_API_KEY) {
    return c.json({ error: "AI service is not configured." }, 503);
  }

  const body = await c.req.json<{ imageBase64?: string; imagesBase64?: unknown[]; isHandwritten?: boolean }>();
  const { imageBase64, imagesBase64, isHandwritten } = body;

  const images: string[] = Array.isArray(imagesBase64) && imagesBase64.length > 0
    ? imagesBase64.filter((x): x is string => typeof x === "string")
    : imageBase64 && typeof imageBase64 === "string"
      ? [imageBase64]
      : [];

  if (images.length === 0) {
    return c.json({ error: "imageBase64 or imagesBase64 is required" }, 400);
  }

  const imageContent: Array<{ type: "image_url"; image_url: { url: string } } | { type: "text"; text: string }> =
    images
      .map((img, i) => [
        { type: "image_url" as const, image_url: { url: `data:image/jpeg;base64,${img}` } },
        { type: "text" as const, text: images.length > 1 ? `Page ${i + 1} of ${images.length}` : "" },
      ])
      .flat()
      .filter((c) => c.type !== "text" || c.text);

  imageContent.push({
    type: "text",
    text: ocrRecipeUserText(images.length, !!isHandwritten),
  });

  try {
    const openai = makeOpenAIClient(env);
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL_HEAVY,
      messages: [
        { role: "system", content: ocrRecipeSystemPrompt(images.length, !!isHandwritten) },
        { role: "user", content: imageContent as OpenAI.Chat.Completions.ChatCompletionContentPart[] },
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || "";
    const recipe = extractJsonBlock(content);
    if (!recipe) return c.json({ error: "Could not extract recipe from image" }, 422);
    return c.json(recipe);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process recipe image";
    console.error("[OCR] Failed:", message);
    return c.json({ error: message }, 500);
  }
});

// ─── POST /api/parse-recipe-text ─────────────────────────────
app.post("/api/parse-recipe-text", async (c) => {
  const env = c.env;
  if (!env.OPENAI_API_KEY) {
    return c.json({ error: "AI service is not configured." }, 503);
  }

  const body = await c.req.json<{ extractedText?: string; isHandwritten?: boolean }>();
  const { extractedText, isHandwritten } = body;

  if (!extractedText || typeof extractedText !== "string" || extractedText.trim().length < 10) {
    return c.json({ error: "extractedText is required and must contain meaningful content" }, 400);
  }

  try {
    const openai = makeOpenAIClient(env);
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL_HEAVY,
      messages: [
        { role: "system", content: parseRecipeTextSystemPrompt(!!isHandwritten) },
        { role: "user", content: parseRecipeTextUserPrompt(extractedText) },
      ],
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || "";
    const recipe = extractJsonBlock(content);
    if (!recipe) return c.json({ error: "Could not parse recipe from text" }, 422);
    return c.json(recipe);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse recipe text";
    console.error("[OCR-Text] Failed:", message);
    return c.json({ error: message }, 500);
  }
});

// ─── POST /api/validate-recipe ───────────────────────────────
interface ValidateIngredient { name: string; amount: number; unit: string; prepNote?: string }
interface ValidateStep { text: string; timerMinutes?: number | null; temperature?: string }

app.post("/api/validate-recipe", async (c) => {
  const env = c.env;
  if (!env.OPENAI_API_KEY) {
    return c.json({ error: "AI service is not configured." }, 503);
  }

  const body = await c.req.json<{ name?: string; ingredients?: ValidateIngredient[]; instructions?: ValidateStep[] }>();
  const { name, ingredients, instructions } = body;

  if (!name || !ingredients?.length || !instructions?.length) {
    return c.json({ error: "name, ingredients, and instructions are required" }, 400);
  }

  const ingredientList = ingredients
    .map((i) => `- ${i.amount} ${i.unit} ${i.name}${i.prepNote ? ` (${i.prepNote})` : ""}`)
    .join("\n");

  const stepList = instructions
    .map((s, idx) =>
      `${idx + 1}. ${s.text}${s.timerMinutes ? ` [${s.timerMinutes} min]` : ""}${s.temperature ? ` [${s.temperature}]` : ""}`,
    )
    .join("\n");

  try {
    const openai = makeOpenAIClient(env);
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL_HEAVY,
      messages: [
        { role: "system", content: validateRecipeSystemPrompt },
        { role: "user", content: validateRecipeUserPrompt(name, ingredientList, stepList) },
      ],
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || "";
    const result = extractJsonBlock(content);
    if (!result) return c.json({ error: "Could not analyze recipe" }, 422);
    return c.json(result);
  } catch (error) {
    console.error("Validate recipe error:", error);
    return c.json({ error: "Failed to validate recipe" }, 500);
  }
});

// ─── POST /api/parse-price ───────────────────────────────────
interface ParsedPrice {
  purchaseCost: number;
  amount: number;
  unit: string;
  container: string | null;
}

app.post("/api/parse-price", async (c) => {
  const env = c.env;
  if (!env.OPENAI_API_KEY) {
    return c.json({ error: "AI service is not configured." }, 503);
  }

  const body = await c.req.json<{ description?: string; ingredientName?: string }>();
  const { description, ingredientName } = body;

  if (!description || typeof description !== "string" || description.trim().length < 3) {
    return c.json({ error: "description is required" }, 400);
  }

  try {
    const openai = makeOpenAIClient(env);
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL_LIGHT,
      messages: [
        { role: "system", content: parsePriceSystemPrompt },
        { role: "user", content: parsePriceUserPrompt(description, ingredientName) },
      ],
      max_completion_tokens: 256,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "";
    let parsed: Partial<ParsedPrice>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return c.json({ error: "Could not parse description" }, 422);
    }

    if (
      typeof parsed.purchaseCost !== "number" ||
      typeof parsed.amount !== "number" ||
      typeof parsed.unit !== "string" ||
      !(parsed.purchaseCost > 0) ||
      !(parsed.amount > 0)
    ) {
      return c.json({ error: "Parsed data is incomplete", raw: parsed }, 422);
    }

    return c.json({
      purchaseCost: parsed.purchaseCost,
      amount: parsed.amount,
      unit: parsed.unit,
      container:
        typeof parsed.container === "string" && parsed.container.trim() ? parsed.container.trim() : null,
    } satisfies ParsedPrice);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse price";
    console.error("[parse-price] Failed:", message);
    return c.json({ error: message }, 500);
  }
});

export default app;
