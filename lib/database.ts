import * as SQLite from 'expo-sqlite';

const DB_NAME = 'chefscale.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initDatabase(db);
  }
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'Other',
      servings INTEGER DEFAULT 1,
      prepTime INTEGER DEFAULT 0,
      cookTime INTEGER DEFAULT 0,
      imageUri TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      recipeId TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS instructions (
      id TEXT PRIMARY KEY,
      recipeId TEXT NOT NULL,
      stepNumber INTEGER NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ingredient_prices (
      id TEXT PRIMARY KEY,
      ingredientName TEXT NOT NULL UNIQUE,
      price REAL NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      store TEXT DEFAULT '',
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);
}

export interface RecipeRow {
  id: string;
  name: string;
  description: string;
  category: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  imageUri: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientRow {
  id: string;
  recipeId: string;
  name: string;
  quantity: number;
  unit: string;
  sortOrder: number;
}

export interface InstructionRow {
  id: string;
  recipeId: string;
  stepNumber: number;
  text: string;
}

export interface IngredientPriceRow {
  id: string;
  ingredientName: string;
  price: number;
  quantity: number;
  unit: string;
  store: string;
  updatedAt: string;
}

export async function getAllRecipes(): Promise<RecipeRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecipeRow>('SELECT * FROM recipes ORDER BY updatedAt DESC');
}

export async function getRecipeById(id: string): Promise<RecipeRow | null> {
  const database = await getDatabase();
  return database.getFirstAsync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id]);
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
    'SELECT * FROM instructions WHERE recipeId = ? ORDER BY stepNumber',
    [recipeId]
  );
}

export async function insertRecipe(recipe: Omit<RecipeRow, 'createdAt' | 'updatedAt'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO recipes (id, name, description, category, servings, prepTime, cookTime, imageUri, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [recipe.id, recipe.name, recipe.description, recipe.category, recipe.servings, recipe.prepTime, recipe.cookTime, recipe.imageUri, recipe.notes]
  );
}

export async function updateRecipe(recipe: Omit<RecipeRow, 'createdAt' | 'updatedAt'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE recipes SET name = ?, description = ?, category = ?, servings = ?, prepTime = ?, cookTime = ?, imageUri = ?, notes = ?, updatedAt = datetime('now')
     WHERE id = ?`,
    [recipe.name, recipe.description, recipe.category, recipe.servings, recipe.prepTime, recipe.cookTime, recipe.imageUri, recipe.notes, recipe.id]
  );
}

export async function deleteRecipe(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
}

export async function insertIngredient(ingredient: IngredientRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO ingredients (id, recipeId, name, quantity, unit, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ingredient.id, ingredient.recipeId, ingredient.name, ingredient.quantity, ingredient.unit, ingredient.sortOrder]
  );
}

export async function deleteIngredientsByRecipeId(recipeId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM ingredients WHERE recipeId = ?', [recipeId]);
}

export async function insertInstruction(instruction: InstructionRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO instructions (id, recipeId, stepNumber, text)
     VALUES (?, ?, ?, ?)`,
    [instruction.id, instruction.recipeId, instruction.stepNumber, instruction.text]
  );
}

export async function deleteInstructionsByRecipeId(recipeId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM instructions WHERE recipeId = ?', [recipeId]);
}

export async function getAllPrices(): Promise<IngredientPriceRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<IngredientPriceRow>('SELECT * FROM ingredient_prices ORDER BY ingredientName');
}

export async function upsertPrice(price: Omit<IngredientPriceRow, 'updatedAt'>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO ingredient_prices (id, ingredientName, price, quantity, unit, store)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(ingredientName) DO UPDATE SET price = ?, quantity = ?, unit = ?, store = ?, updatedAt = datetime('now')`,
    [price.id, price.ingredientName, price.price, price.quantity, price.unit, price.store, price.price, price.quantity, price.unit, price.store]
  );
}

export async function deletePrice(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM ingredient_prices WHERE id = ?', [id]);
}
