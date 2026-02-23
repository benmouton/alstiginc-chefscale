import * as SQLite from 'expo-sqlite';

const DB_NAME = 'chefscale.db';
const DB_VERSION = 3;

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
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

  if (currentVersion < DB_VERSION) {
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      DROP TABLE IF EXISTS recipe_photos;
      DROP TABLE IF EXISTS ingredient_prices;
      DROP TABLE IF EXISTS instructions;
      DROP TABLE IF EXISTS ingredients;
      DROP TABLE IF EXISTS recipes;

      CREATE TABLE recipes (
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
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE ingredients (
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
        FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
      );

      CREATE TABLE instructions (
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

      CREATE TABLE recipe_photos (
        id TEXT PRIMARY KEY,
        recipeId TEXT NOT NULL,
        uri TEXT NOT NULL,
        caption TEXT DEFAULT '',
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
      );

      CREATE TABLE ingredient_prices (
        id TEXT PRIMARY KEY,
        ingredientName TEXT NOT NULL UNIQUE,
        costPerUnit REAL,
        costUnit TEXT DEFAULT '',
        purchaseUnit TEXT DEFAULT '',
        purchaseCost REAL,
        updatedAt TEXT DEFAULT (datetime('now'))
      );

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
    `INSERT INTO recipes (id, name, description, category, tags, baseServings, baseYieldUnit, prepTime, cookTime, imageUri, notes, source, isFavorite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recipe.id, recipe.name, recipe.description, recipe.category,
      recipe.tags, recipe.baseServings, recipe.baseYieldUnit,
      recipe.prepTime, recipe.cookTime, recipe.imageUri,
      recipe.notes, recipe.source, recipe.isFavorite,
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
       updatedAt = datetime('now')
     WHERE id = ?`,
    [
      recipe.name, recipe.description, recipe.category, recipe.tags,
      recipe.baseServings, recipe.baseYieldUnit, recipe.prepTime, recipe.cookTime,
      recipe.imageUri, recipe.notes, recipe.source, recipe.isFavorite,
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
    `INSERT INTO ingredients (id, recipeId, name, amount, unit, category, costPerUnit, costUnit, fdcId, isOptional, isScalable, prepNote, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ingredient.id, ingredient.recipeId, ingredient.name,
      ingredient.amount, ingredient.unit, ingredient.category,
      ingredient.costPerUnit, ingredient.costUnit, ingredient.fdcId,
      ingredient.isOptional, ingredient.isScalable, ingredient.prepNote,
      ingredient.sortOrder,
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
    `INSERT INTO recipe_photos (id, recipeId, uri, caption, sortOrder)
     VALUES (?, ?, ?, ?, ?)`,
    [photo.id, photo.recipeId, photo.uri, photo.caption, photo.sortOrder]
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
  const normalizedName = price.ingredientName.toLowerCase().trim();
  await database.runAsync(
    `INSERT INTO ingredient_prices (id, ingredientName, costPerUnit, costUnit, purchaseUnit, purchaseCost)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(ingredientName) DO UPDATE SET
       costPerUnit = ?, costUnit = ?, purchaseUnit = ?, purchaseCost = ?,
       updatedAt = datetime('now')`,
    [
      price.id, normalizedName,
      price.costPerUnit, price.costUnit, price.purchaseUnit, price.purchaseCost,
      price.costPerUnit, price.costUnit, price.purchaseUnit, price.purchaseCost,
    ]
  );
}

export async function deletePrice(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM ingredient_prices WHERE id = ?', [id]);
}
