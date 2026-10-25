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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const count = db.prepare("SELECT COUNT(*) AS total FROM products").get().total;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (nombre, formato, precio, descripcion, emoji)
    VALUES (?, ?, ?, ?, ?)
  `);
  const seed = db.transaction(() => {
    insert.run("Miel Multiflora", "500 g", 5000, "Miel de flores variadas, ideal para bebidas y postres.", "🍯");
    insert.run("Miel de Ulmo", "500 g", 6000, "Miel de aroma intenso y sabor característico.", "🌿");
    insert.run("Miel de Quillay", "500 g", 5500, "Una miel de sabor suave para disfrutar cada día.", "🌼");
  });
  seed();
}
