import { describe, it, expect } from "vitest";
import {
  ocrRecipeSystemPrompt,
  ocrRecipeUserText,
  parseRecipeTextSystemPrompt,
  validateRecipeSystemPrompt,
  parsePriceSystemPrompt,
} from "../src/prompts";

// Locks prompt shape to byte-for-byte parity with Replit chef-scale.replit.app.

describe("ocr-recipe prompts", () => {
  it("single-image prompt starts with 'Analyze the image of a recipe'", () => {
    expect(ocrRecipeSystemPrompt(1)).toContain("Analyze the image of a recipe");
  });

  it("multi-image prompt mentions image count twice (lead + tail)", () => {
    const p = ocrRecipeSystemPrompt(3);
    expect(p).toContain("3 images");
    expect(p).toContain("Combine all pages into one complete recipe");
  });

  it("JSON shape includes all required fields", () => {
    const p = ocrRecipeSystemPrompt(1);
    for (const field of ["name", "description", "category", "baseServings", "prepTime", "cookTime", "ingredients", "instructions", "notes", "source"]) {
      expect(p).toContain(`"${field}"`);
    }
  });

  it("declares the canonical unit list", () => {
    expect(ocrRecipeSystemPrompt(1)).toContain("tsp, tbsp, cup, fl_oz, oz, lb, g, kg, ml, l, each, pinch, bunch, can, bottle, clove, sprig, head, stalk, piece");
  });

  it("user text varies by image count", () => {
    expect(ocrRecipeUserText(1)).toBe("Extract the recipe from this image into the JSON format specified.");
    expect(ocrRecipeUserText(4)).toContain("4 photos");
  });
});

describe("parse-recipe-text prompt", () => {
  it("mentions OCR artifact handling", () => {
    expect(parseRecipeTextSystemPrompt).toContain("OCR artifacts");
  });

  it("includes f1our→flour example", () => {
    expect(parseRecipeTextSystemPrompt).toContain(`"f1our" → "flour"`);
  });
});

describe("validate-recipe prompt", () => {
  it("asks about ingredient usage", () => {
    expect(validateRecipeSystemPrompt).toContain("all ingredients are used in at least one instruction step");
  });

  it("enumerates logical gap categories", () => {
    for (const gap of ["preheating", "combining", "resting/cooling", "plating/serving", "seasoning"]) {
      expect(validateRecipeSystemPrompt).toContain(gap);
    }
  });
});

describe("parse-price prompt", () => {
  it("enumerates the unit synonyms", () => {
    expect(parsePriceSystemPrompt).toContain(`"pound/pounds/lbs" → "lb"`);
    expect(parsePriceSystemPrompt).toContain(`"dozen/dz" → "dozen"`);
  });

  it("rejects markdown wrap", () => {
    expect(parsePriceSystemPrompt).toContain("Do NOT wrap in markdown");
  });

  it("enumerates the total-amount rule with the 6x10lb example", () => {
    expect(parsePriceSystemPrompt).toContain("60 lb");
  });
});
