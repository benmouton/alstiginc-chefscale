import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'chefscale.db';
const DB_VERSION = 5;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabaseWithRetry(): Promise<SQLite.SQLiteDatabase> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await SQLite.openDatabaseAsync(DB_NAME);
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw lastError;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseWithRetry();
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  let currentVersion = 0;
  try {
    const versionRow = await database.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    currentVersion = versionRow?.user_version ?? 0;
  } catch {
    currentVersion = 0;
  }

  if (currentVersion === 0) {
    // Fresh install: CREATE all tables with new columns included
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'Entrée',
        tags TEXT DEFAULT '[]',
        baseServings INTEGER DEFAULT 4,
        baseYieldUnit TEXT DEFAULT 'servings',
        prepTime INTEGER DEFAULT 0,
        cookTime INTEGER DEFAULT 0,
        imageUri TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        source TEXT DEFAULT '',
        isFavorite INTEGER DEFAULT 0,
        station TEXT DEFAULT '',
        dietaryFlags TEXT DEFAULT '[]',
        parentRecipeId TEXT DEFAULT '',
        variationLabel TEXT DEFAULT '',
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        recipeId TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        unit TEXT NOT NULL,
        category TEXT DEFAULT '',
        costPerUnit REAL,
        costUnit TEXT,
        fdcId INTEGER,
        isOptional INTEGER DEFAULT 0,
        isScalable INTEGER DEFAULT 1,
        prepNote TEXT DEFAULT '',
        sortOrder INTEGER DEFAULT 0,
        yieldPercent REAL DEFAULT 100,
        subrecipeId TEXT DEFAULT '',
        FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS instructions (
        id TEXT PRIMARY KEY,
        recipeId TEXT NOT NULL,
        stepNumber INTEGER NOT NULL,
        text TEXT NOT NULL,
        timerMinutes INTEGER,
        temperature TEXT DEFAULT '',
        photoUri TEXT DEFAULT '',
        sortOrder INTEGER DEFAULT 0,
        FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS recipe_photos (
        id TEXT PRIMARY KEY,
        recipeId TEXT NOT NULL,
        uri TEXT NOT NULL,
        caption TEXT DEFAULT '',
        sortOrder INTEGER DEFAULT 0,
        photoType TEXT DEFAULT 'general',
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ingredient_prices (
        id TEXT PRIMARY KEY,
        ingredientName TEXT NOT NULL UNIQUE COLLATE NOCASE,
        costPerUnit REAL,
        costUnit TEXT DEFAULT '',
        purchaseUnit TEXT DEFAULT '',
        purchaseCost REAL,
        updatedAt TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_ingredients_recipeId ON ingredients(recipeId);
      CREATE INDEX IF NOT EXISTS idx_instructions_recipeId ON instructions(recipeId);
      CREATE INDEX IF NOT EXISTS idx_recipe_photos_recipeId ON recipe_photos(recipeId);
      CREATE INDEX IF NOT EXISTS idx_recipes_parentRecipeId ON recipes(parentRecipeId);
      CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);

      PRAGMA user_version = ${DB_VERSION};
    `);
  } else if (currentVersion < DB_VERSION) {
    // Existing install: ALTER TABLE to add new columns
    // Each ALTER is wrapped in try/catch to handle incremental upgrades
    // where a column may already exist (e.g. upgrading from v2 → v4 skipping v3)
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    const alterStatements = [
      `ALTER TABLE recipes ADD COLUMN station TEXT DEFAULT ''`,
      `ALTER TABLE recipes ADD COLUMN dietaryFlags TEXT DEFAULT '[]'`,
      `ALTER TABLE recipes ADD COLUMN parentRecipeId TEXT DEFAULT ''`,
      `ALTER TABLE recipes ADD COLUMN variationLabel TEXT DEFAULT ''`,
      `ALTER TABLE ingredients ADD COLUMN yieldPercent REAL DEFAULT 100`,
      `ALTER TABLE ingredients ADD COLUMN subrecipeId TEXT DEFAULT ''`,
      `ALTER TABLE recipe_photos ADD COLUMN photoType TEXT DEFAULT 'general'`,
    ];
    for (const sql of alterStatements) {
      try {
        await database.execAsync(sql);
      } catch {
        // Column already exists — safe to ignore on incremental upgrades
      }
    }

    // v5: rebuild ingredient_prices with COLLATE NOCASE on ingredientName.
    // SQLite cannot ALTER a column's collation, so copy-rename. If the table
    // doesn't exist yet (e.g. user jumped from v<4 without going through v4's
    // ingredient_prices create), create it fresh.
    if (currentVersion < 5) {
      const existing = await database.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='ingredient_prices'"
      );
      if (existing) {
        // INSERT OR IGNORE + ORDER BY updatedAt DESC keeps the most recently
        // updated row when two case-variants collide (e.g. "Flour" + "flour").
        await database.execAsync(`
          CREATE TABLE ingredient_prices_new (
            id TEXT PRIMARY KEY,
            ingredientName TEXT NOT NULL UNIQUE COLLATE NOCASE,
            costPerUnit REAL,
            costUnit TEXT DEFAULT '',
            purchaseUnit TEXT DEFAULT '',
            purchaseCost REAL,
            updatedAt TEXT DEFAULT (datetime('now'))
          );
          INSERT OR IGNORE INTO ingredient_prices_new
            (id, ingredientName, costPerUnit, costUnit, purchaseUnit, purchaseCost, updatedAt)
            SELECT id, ingredientName, costPerUnit, costUnit, purchaseUnit, purchaseCost, updatedAt
            FROM ingredient_prices
            ORDER BY updatedAt DESC;
          DROP TABLE ingredient_prices;
          ALTER TABLE ingredient_prices_new RENAME TO ingredient_prices;
        `);
      } else {
        await database.execAsync(`
          CREATE TABLE ingredient_prices (
            id TEXT PRIMARY KEY,
            ingredientName TEXT NOT NULL UNIQUE COLLATE NOCASE,
            costPerUnit REAL,
            costUnit TEXT DEFAULT '',
            purchaseUnit TEXT DEFAULT '',
            purchaseCost REAL,
            updatedAt TEXT DEFAULT (datetime('now'))
          );
        `);
      }
    }

    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_ingredients_recipeId ON ingredients(recipeId);
      CREATE INDEX IF NOT EXISTS idx_instructions_recipeId ON instructions(recipeId);
      CREATE INDEX IF NOT EXISTS idx_recipe_photos_recipeId ON recipe_photos(recipeId);
      CREATE INDEX IF NOT EXISTS idx_recipes_parentRecipeId ON recipes(parentRecipeId);
      CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);

      PRAGMA user_version = ${DB_VERSION};
    `);
  } else {
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
  }
}

export interface RecipeRow {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string;
  baseServings: number;
  baseYieldUnit: string;
  prepTime: number;
  cookTime: number;
  imageUri: string;
  notes: string;
  source: string;
  isFavorite: number;
  station: string;
  dietaryFlags: string;
  parentRecipeId: string;
  variationLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientRow {
  id: string;
  recipeId: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  costPerUnit: number | null;
  costUnit: string | null;
  fdcId: number | null;
  isOptional: number;
  isScalable: number;
  prepNote: string;
  sortOrder: number;
  yieldPercent: number;
  subrecipeId: string;
}

export interface InstructionRow {
  id: string;
  recipeId: string;
  stepNumber: number;
  text: string;
  timerMinutes: number | null;
  temperature: string;
  photoUri: string;
  sortOrder: number;
}

export interface RecipePhotoRow {
  id: string;
  recipeId: string;
  uri: string;
  caption: string;
  sortOrder: number;
  photoType: string;
  createdAt: string;
}

export interface IngredientPriceRow {
  id: string;
  ingredientName: string;
  costPerUnit: number | null;
  costUnit: string;
  purchaseUnit: string;
  purchaseCost: number | null;
  updatedAt: string;
}

export interface RecipeWithDetails extends RecipeRow {
  ingredients: IngredientRow[];
  instructions: InstructionRow[];
  photos: RecipePhotoRow[];
}

export async function getAllRecipes(): Promise<RecipeRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecipeRow>('SELECT * FROM recipes ORDER BY updatedAt DESC');
}

export async function getRecipeById(id: string): Promise<RecipeRow | null> {
  const database = await getDatabase();
  return database.getFirstAsync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id]);
}

export async function getRecipeWithDetails(id: string): Promise<RecipeWithDetails | null> {
  const database = await getDatabase();
  const recipe = await database.getFirstAsync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id]);
  if (!recipe) return null;

  const ingredients = await database.getAllAsync<IngredientRow>(
    'SELECT * FROM ingredients WHERE recipeId = ? ORDER BY sortOrder',
    [id]
  );
  const instructions = await database.getAllAsync<InstructionRow>(
    'SELECT * FROM instructions WHERE recipeId = ? ORDER BY sortOrder, stepNumber',
    [id]
  );
  const photos = await database.getAllAsync<RecipePhotoRow>(
    'SELECT * FROM recipe_photos WHERE recipeId = ? ORDER BY sortOrder',
    [id]
  );

  return { ...recipe, ingredients, instructions, photos };
}

export async function getRecipesByCategory(category: string): Promise<RecipeRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecipeRow>(
    'SELECT * FROM recipes WHERE category = ? ORDER BY updatedAt DESC',
    [category]
  );
}

export async function searchRecipes(query: string): Promise<RecipeRow[]> {
  const database = await getDatabase();
  const pattern = `%${query}%`;
  return database.getAllAsync<RecipeRow>(
    `SELECT DISTINCT r.* FROM recipes r
     LEFT JOIN ingredients i ON i.recipeId = r.id
     WHERE r.name LIKE ? OR r.description LIKE ? OR r.tags LIKE ? OR i.name LIKE ?
     ORDER BY r.updatedAt DESC`,
    [pattern, pattern, pattern, pattern]
  );
}

export async function getRecipesByAllergenFree(allergenKeywords: string[]): Promise<RecipeRow[]> {
  const database = await getDatabase();
  if (allergenKeywords.length === 0) return getAllRecipes();

  const conditions = allergenKeywords.map(() => 'LOWER(i.name) LIKE ?').join(' OR ');
  const params = allergenKeywords.map((k) => `%${k.toLowerCase()}%`);

  return database.getAllAsync<RecipeRow>(
    `SELECT r.* FROM recipes r
     WHERE r.id NOT IN (
       SELECT DISTINCT i.recipeId FROM ingredients i
       WHERE ${conditions}
     )
     ORDER BY r.updatedAt DESC`,
    params
  );
}

export async function getFavoriteRecipes(): Promise<RecipeRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecipeRow>(
    'SELECT * FROM recipes WHERE isFavorite = 1 ORDER BY updatedAt DESC'
  );
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE recipes SET isFavorite = ?, updatedAt = datetime(\'now\') WHERE id = ?',
    [isFavorite ? 1 : 0, id]
  );
}

export async function getIngredientsByRecipeId(recipeId: string): Promise<IngredientRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<IngredientRow>(
    'SELECT * FROM ingredients WHERE recipeId = ? ORDER BY sortOrder',
    [recipeId]
  );
}

export async function getInstructionsByRecipeId(recipeId: string): Promise<InstructionRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<InstructionRow>(
    'SELECT * FROM instructions WHERE recipeId = ? ORDER BY sortOrder, stepNumber',
    [recipeId]
  );
}

export async function insertRecipe(recipe: Omit<RecipeRow, 'createdAt' | 'updatedAt'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO recipes (id, name, description, category, tags, baseServings, baseYieldUnit, prepTime, cookTime, imageUri, notes, source, isFavorite, station, dietaryFlags, parentRecipeId, variationLabel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recipe.id, recipe.name, recipe.description, recipe.category,
      recipe.tags, recipe.baseServings, recipe.baseYieldUnit,
      recipe.prepTime, recipe.cookTime, recipe.imageUri,
      recipe.notes, recipe.source, recipe.isFavorite,
      recipe.station, recipe.dietaryFlags, recipe.parentRecipeId, recipe.variationLabel,
    ]
  );
}

export async function updateRecipe(recipe: Omit<RecipeRow, 'createdAt' | 'updatedAt'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE recipes SET
       name = ?, description = ?, category = ?, tags = ?,
       baseServings = ?, baseYieldUnit = ?, prepTime = ?, cookTime = ?,
       imageUri = ?, notes = ?, source = ?, isFavorite = ?,
       station = ?, dietaryFlags = ?, parentRecipeId = ?, variationLabel = ?,
       updatedAt = datetime('now')
     WHERE id = ?`,
    [
      recipe.name, recipe.description, recipe.category, recipe.tags,
      recipe.baseServings, recipe.baseYieldUnit, recipe.prepTime, recipe.cookTime,
      recipe.imageUri, recipe.notes, recipe.source, recipe.isFavorite,
      recipe.station, recipe.dietaryFlags, recipe.parentRecipeId, recipe.variationLabel,
      recipe.id,
    ]
  );
}

export async function deleteRecipe(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
}

export async function insertIngredient(ingredient: IngredientRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO ingredients (id, recipeId, name, amount, unit, category, costPerUnit, costUnit, fdcId, isOptional, isScalable, prepNote, sortOrder, yieldPercent, subrecipeId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ingredient.id, ingredient.recipeId, ingredient.name,
      ingredient.amount, ingredient.unit, ingredient.category,
      ingredient.costPerUnit, ingredient.costUnit, ingredient.fdcId,
      ingredient.isOptional, ingredient.isScalable, ingredient.prepNote,
      ingredient.sortOrder, ingredient.yieldPercent, ingredient.subrecipeId,
    ]
  );
}

export async function deleteIngredientsByRecipeId(recipeId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM ingredients WHERE recipeId = ?', [recipeId]);
}

export async function insertInstruction(instruction: InstructionRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO instructions (id, recipeId, stepNumber, text, timerMinutes, temperature, photoUri, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      instruction.id, instruction.recipeId, instruction.stepNumber,
      instruction.text, instruction.timerMinutes, instruction.temperature,
      instruction.photoUri || '', instruction.sortOrder,
    ]
  );
}

export async function deleteInstructionsByRecipeId(recipeId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM instructions WHERE recipeId = ?', [recipeId]);
}

export async function insertRecipePhoto(photo: Omit<RecipePhotoRow, 'createdAt'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO recipe_photos (id, recipeId, uri, caption, sortOrder, photoType)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [photo.id, photo.recipeId, photo.uri, photo.caption, photo.sortOrder, photo.photoType]
  );
}

export async function deleteRecipePhotosByRecipeId(recipeId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM recipe_photos WHERE recipeId = ?', [recipeId]);
}

export async function deleteRecipePhoto(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM recipe_photos WHERE id = ?', [id]);
}

export async function getRecipePhotos(recipeId: string): Promise<RecipePhotoRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecipePhotoRow>(
    'SELECT * FROM recipe_photos WHERE recipeId = ? ORDER BY sortOrder',
    [recipeId]
  );
}

export async function getAllPrices(): Promise<IngredientPriceRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<IngredientPriceRow>('SELECT * FROM ingredient_prices ORDER BY ingredientName');
}

export async function upsertPrice(price: Omit<IngredientPriceRow, 'updatedAt'>): Promise<void> {
  const database = await getDatabase();
  // Preserve display case. The ingredientName column uses COLLATE NOCASE so
  // ON CONFLICT / UNIQUE treats "Flour" and "flour" as the same row.
  const name = price.ingredientName.trim();
  await database.runAsync(
    `INSERT INTO ingredient_prices (id, ingredientName, costPerUnit, costUnit, purchaseUnit, purchaseCost)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(ingredientName) DO UPDATE SET
       costPerUnit = ?, costUnit = ?, purchaseUnit = ?, purchaseCost = ?,
       updatedAt = datetime('now')`,
    [
      price.id, name,
      price.costPerUnit, price.costUnit, price.purchaseUnit, price.purchaseCost,
      price.costPerUnit, price.costUnit, price.purchaseUnit, price.purchaseCost,
    ]
  );
}

export async function deletePrice(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM ingredient_prices WHERE id = ?', [id]);
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM recipe_photos;
    DELETE FROM instructions;
    DELETE FROM ingredients;
    DELETE FROM ingredient_prices;
    DELETE FROM recipes;
  `);
}

export async function getRecipeCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM recipes');
  return row?.count ?? 0;
}

export async function getPriceCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM ingredient_prices');
  return row?.count ?? 0;
}

export async function getVariationsByParentId(parentId: string): Promise<RecipeRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecipeRow>(
    'SELECT * FROM recipes WHERE parentRecipeId = ? ORDER BY updatedAt DESC',
    [parentId]
  );
}

export async function getRecipeBasicById(id: string): Promise<{id: string, name: string, baseServings: number, baseYieldUnit: string} | null> {
  const database = await getDatabase();
  return database.getFirstAsync<{id: string, name: string, baseServings: number, baseYieldUnit: string}>(
    'SELECT id, name, baseServings, baseYieldUnit FROM recipes WHERE id = ?',
    [id]
  );
}
