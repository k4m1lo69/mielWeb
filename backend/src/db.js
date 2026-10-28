import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const databasePath = process.env.DATABASE_PATH || "./data/mielweb.sqlite";
const absolutePath = path.resolve(databasePath);
fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

export const db = new Database(absolutePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    formato TEXT NOT NULL,
    precio INTEGER NOT NULL CHECK (precio > 0),
    descripcion TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🍯',
    imagen TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migración: agrega la columna imagen si la base ya existía sin ella.
const columnasProductos = db.prepare("PRAGMA table_info(products)").all();
if (!columnasProductos.some((columna) => columna.name === "imagen")) {
  db.exec("ALTER TABLE products ADD COLUMN imagen TEXT");
}