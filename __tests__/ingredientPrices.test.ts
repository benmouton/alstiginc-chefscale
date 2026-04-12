// Validates the ingredient_prices schema + write paths used by the app.
//
// Why these tests exist: two different code paths write to ingredient_prices —
// saveRecipe's stub INSERT in store/useRecipeStore.ts and upsertPrice in
// lib/database.ts. They disagreed on casing before the fix in DB_VERSION 5:
// the store preserved case, upsertPrice lowercased. The UNIQUE constraint
// without COLLATE NOCASE was case-sensitive, so "Flour" and "flour" created
// duplicate rows.
//
// These tests embed the exact schema + SQL from lib/database.ts. If the
// schema changes there, update this file too — it's a firewall against
// regressing COLLATE NOCASE.

import Database from 'better-sqlite3';

// --- Schema copied from lib/database.ts (DB_VERSION 5). Keep in sync. ---
const CREATE_INGREDIENT_PRICES_V5 = `
  CREATE TABLE ingredient_prices (
    id TEXT PRIMARY KEY,
    ingredientName TEXT NOT NULL UNIQUE COLLATE NOCASE,
    costPerUnit REAL,
    costUnit TEXT DEFAULT '',
    purchaseUnit TEXT DEFAULT '',
    purchaseCost REAL,
    updatedAt TEXT DEFAULT (datetime('now'))
  );
`;

const CREATE_INGREDIENT_PRICES_V4 = `
  CREATE TABLE ingredient_prices (
    id TEXT PRIMARY KEY,
    ingredientName TEXT NOT NULL UNIQUE,
    costPerUnit REAL,
    costUnit TEXT DEFAULT '',
    purchaseUnit TEXT DEFAULT '',
    purchaseCost REAL,
    updatedAt TEXT DEFAULT (datetime('now'))
  );
`;

// Mirrors the v5 migration in lib/database.ts — rebuild the table so the
// ingredientName column gains COLLATE NOCASE. INSERT OR IGNORE + ORDER BY
// updatedAt DESC keeps the newest row when case-variants collide.
const MIGRATE_V4_TO_V5 = `
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
`;

// Store stub path — from store/useRecipeStore.ts saveRecipe.
function stubInsert(db: Database.Database, name: string, unit: string) {
  db.prepare(
    'INSERT OR IGNORE INTO ingredient_prices (id, ingredientName, costPerUnit, costUnit) VALUES (?, ?, NULL, ?)'
  ).run(`id-${Math.random()}`, name.trim(), unit || '');
}

// upsertPrice path — from lib/database.ts upsertPrice.
function upsertPrice(
  db: Database.Database,
  price: {
    ingredientName: string;
    costPerUnit: number | null;
    costUnit: string;
    purchaseUnit: string;
    purchaseCost: number | null;
  }
) {
  const name = price.ingredientName.trim();
  db.prepare(
    `INSERT INTO ingredient_prices (id, ingredientName, costPerUnit, costUnit, purchaseUnit, purchaseCost)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(ingredientName) DO UPDATE SET
       costPerUnit = ?, costUnit = ?, purchaseUnit = ?, purchaseCost = ?,
       updatedAt = datetime('now')`
  ).run(
    `id-${Math.random()}`,
    name,
    price.costPerUnit,
    price.costUnit,
    price.purchaseUnit,
    price.purchaseCost,
    price.costPerUnit,
    price.costUnit,
    price.purchaseUnit,
    price.purchaseCost
  );
}

function freshV5(): Database.Database {
  const db = new Database(':memory:');
  db.exec(CREATE_INGREDIENT_PRICES_V5);
  return db;
}

describe('ingredient_prices — v5 schema (COLLATE NOCASE)', () => {
  test('UNIQUE constraint rejects case-variant direct inserts', () => {
    const db = freshV5();
    db.prepare('INSERT INTO ingredient_prices (id, ingredientName) VALUES (?, ?)').run('a', 'Flour');
    expect(() => {
      db.prepare('INSERT INTO ingredient_prices (id, ingredientName) VALUES (?, ?)').run('b', 'flour');
    }).toThrow(/UNIQUE constraint failed/);
  });

  test('upsertPrice collapses "Flour" and "flour" into one row', () => {
    const db = freshV5();
    upsertPrice(db, {
      ingredientName: 'Flour',
      costPerUnit: 0.6,
      costUnit: 'lb',
      purchaseUnit: '50 lb sack',
      purchaseCost: 30,
    });
    upsertPrice(db, {
      ingredientName: 'flour',
      costPerUnit: 0.25,
      costUnit: 'cup',
      purchaseUnit: '1 lb',
      purchaseCost: 5,
    });

    const rows = db.prepare('SELECT * FROM ingredient_prices').all() as Array<{
      ingredientName: string;
      costPerUnit: number;
      purchaseCost: number;
    }>;
    expect(rows).toHaveLength(1);
    // The UPDATE clause does not rewrite ingredientName, so the original
    // case ("Flour") is preserved — only the cost fields are overwritten.
    expect(rows[0].ingredientName).toBe('Flour');
    expect(rows[0].costPerUnit).toBe(0.25);
    expect(rows[0].purchaseCost).toBe(5);
  });

  test('saveRecipe stub + upsertPrice do not duplicate on case-variant', () => {
    // Reproduces the original bug flow:
    //   1) User saves a recipe with ingredient "Flour" — store stub inserts a
    //      blank row so it shows up in the Prices tab.
    //   2) User later adds cost data — upsertPrice is called with "flour"
    //      (pre-fix this lowercased; post-fix it preserves case).
    // Expected: exactly one row. Pre-fix this would have created two.
    const db = freshV5();

    stubInsert(db, 'Flour', 'cup');
    upsertPrice(db, {
      ingredientName: 'flour',
      costPerUnit: 0.6,
      costUnit: 'lb',
      purchaseUnit: '50 lb sack',
      purchaseCost: 30,
    });

    const rows = db.prepare('SELECT * FROM ingredient_prices').all() as Array<{
      ingredientName: string;
      costPerUnit: number | null;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].costPerUnit).toBe(0.6);
  });

  test('stub insert is case-insensitive no-op when row already exists', () => {
    // User creates recipe 1 with "Flour", then recipe 2 with "FLOUR" uppercase.
    // Second save should NOT create a new row. Validates the INSERT OR IGNORE
    // + COLLATE NOCASE path in store/useRecipeStore.ts saveRecipe.
    const db = freshV5();
    stubInsert(db, 'Flour', 'cup');
    stubInsert(db, 'FLOUR', 'cup');
    stubInsert(db, 'flour', 'tbsp');

    const rows = db.prepare('SELECT * FROM ingredient_prices').all() as Array<{
      ingredientName: string;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].ingredientName).toBe('Flour'); // first writer wins
  });

  test('ON CONFLICT preserves original display case but updates cost', () => {
    // Regression guard: the UPDATE clause of upsertPrice must not clobber
    // ingredientName. If someone changes the ON CONFLICT DO UPDATE to also
    // SET ingredientName = excluded.ingredientName, the Prices tab would
    // show the most recent case variant — confusing for users who entered
    // "Flour" but then see "FLOUR" after a second edit.
    const db = freshV5();
    upsertPrice(db, {
      ingredientName: 'Butter',
      costPerUnit: 5,
      costUnit: 'lb',
      purchaseUnit: '1 lb',
      purchaseCost: 5,
    });
    upsertPrice(db, {
      ingredientName: 'BUTTER',
      costPerUnit: 6,
      costUnit: 'lb',
      purchaseUnit: '1 lb',
      purchaseCost: 6,
    });

    const rows = db.prepare('SELECT * FROM ingredient_prices').all() as Array<{
      ingredientName: string;
      costPerUnit: number;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].ingredientName).toBe('Butter'); // original case kept
    expect(rows[0].costPerUnit).toBe(6); // but cost updated
  });
});

describe('ingredient_prices — v4 → v5 migration', () => {
  test('migration deduplicates pre-existing case-variant rows', () => {
    // Simulates an existing v4 install where both "Flour" and "flour" got
    // inserted under the case-sensitive UNIQUE. After migrating to v5 with
    // COLLATE NOCASE, only one row should remain — the newer one wins via
    // ORDER BY updatedAt DESC + INSERT OR IGNORE.
    const db = new Database(':memory:');
    db.exec(CREATE_INGREDIENT_PRICES_V4);

    db.prepare(
      `INSERT INTO ingredient_prices (id, ingredientName, costPerUnit, costUnit, purchaseUnit, purchaseCost, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))`
    ).run('old', 'Flour', null, '', '', null);
    db.prepare(
      `INSERT INTO ingredient_prices (id, ingredientName, costPerUnit, costUnit, purchaseUnit, purchaseCost, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run('new', 'flour', 0.6, 'lb', '50 lb sack', 30);

    // Before migration: two rows because v4 is case-sensitive
    expect(db.prepare('SELECT COUNT(*) as c FROM ingredient_prices').get()).toEqual({ c: 2 });

    db.exec(MIGRATE_V4_TO_V5);

    const rows = db.prepare('SELECT * FROM ingredient_prices').all() as Array<{
      id: string;
      ingredientName: string;
      costPerUnit: number | null;
    }>;
    expect(rows).toHaveLength(1);
    // The newer row (with real cost data) won the tiebreak
    expect(rows[0].id).toBe('new');
    expect(rows[0].ingredientName).toBe('flour');
    expect(rows[0].costPerUnit).toBe(0.6);
  });

  test('migration on clean v4 table produces a v5 table with COLLATE NOCASE', () => {
    const db = new Database(':memory:');
    db.exec(CREATE_INGREDIENT_PRICES_V4);
    db.exec(MIGRATE_V4_TO_V5);

    // Post-migration UNIQUE must be case-insensitive
    db.prepare('INSERT INTO ingredient_prices (id, ingredientName) VALUES (?, ?)').run('a', 'Sugar');
    expect(() => {
      db.prepare('INSERT INTO ingredient_prices (id, ingredientName) VALUES (?, ?)').run('b', 'SUGAR');
    }).toThrow(/UNIQUE constraint failed/);
  });
});
