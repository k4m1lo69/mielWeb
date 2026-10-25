import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { db } from "./db.js";
import { clearAdminCookie, createAdminCookie, requireAdmin } from "./auth.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET === "REEMPLAZA_POR_UN_SECRETO_LARGO_ALEATORIO") {
  console.error("ERROR: configura JWT_SECRET en .env con al menos 32 caracteres aleatorios.");
  process.exit(1);
}

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", frontendOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function requireSameOriginForWrites(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin !== frontendOrigin) {
    return res.status(403).json({ error: "Origen no autorizado." });
  }
  next();
}
app.use("/api", requireSameOriginForWrites);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera 15 minutos e inténtalo nuevamente." }
});

const getProducts = db.prepare(`
  SELECT id, nombre, formato, precio, descripcion, emoji
  FROM products ORDER BY id DESC
`);
const getProduct = db.prepare(`
  SELECT id, nombre, formato, precio, descripcion, emoji
  FROM products WHERE id = ?
`);

function validateProduct(body) {
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const formato = typeof body.formato === "string" ? body.formato.trim() : "";
  const descripcion = typeof body.descripcion === "string" ? body.descripcion.trim() : "";
  const emoji = typeof body.emoji === "string" ? body.emoji.trim() : "🍯";
  const precio = Number(body.precio);

  if (!nombre || nombre.length > 100) return { error: "El nombre es obligatorio y no debe superar 100 caracteres." };
  if (!formato || formato.length > 40) return { error: "El formato es obligatorio y no debe superar 40 caracteres." };
  if (!Number.isSafeInteger(precio) || precio <= 0 || precio > 100000000) return { error: "El precio debe ser un número entero positivo válido." };
  if (!descripcion || descripcion.length > 1000) return { error: "La descripción es obligatoria y no debe superar 1000 caracteres." };
  if (emoji.length > 16) return { error: "El campo emoji es demasiado largo." };
  return { value: { nombre, formato, precio, descripcion, emoji: emoji || "🍯" } };
}

async function ensureAdminFromEnvironment() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD no configurados. No se creó un administrador inicial.");
    return;
  }
  if (password.length < 14 || password === "CAMBIA_ESTA_CLAVE_POR_UNA_LARGA_Y_UNICA") {
    console.error("ERROR: ADMIN_PASSWORD debe ser una contraseña única de al menos 14 caracteres.");
    process.exit(1);
  }
  const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare("INSERT INTO admins (email, password_hash) VALUES (?, ?)").run(email, passwordHash);
    console.log(`Administrador inicial creado para ${email}.`);
  } else {
    console.log(`Administrador ${email} ya existe; no se cambió su contraseña.`);
  }
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Catálogo público: solo lectura.
app.get("/api/products", (_req, res) => {
  res.json(getProducts.all());
});

// El primer administrador se crea desde variables de entorno, nunca desde una ruta pública.
app.post("/api/auth/login", loginLimiter, (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const admin = db.prepare("SELECT id, email, password_hash FROM admins WHERE email = ?").get(email);

  const fallbackHash = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.4J2VZrM4p8wR1V3xN4b4vQfN9M9X6Ue"; 
  const hashToCompare = admin?.password_hash || fallbackHash;
  const passwordMatches = bcrypt.compareSync(password, hashToCompare);

  if (!admin || !passwordMatches) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }

  createAdminCookie(res, admin);
  return res.json({ admin: { email: admin.email } });
});

app.get("/api/auth/me", requireAdmin, (req, res) => {
  res.json({ admin: { email: req.admin.email } });
});

app.post("/api/auth/logout", requireAdmin, (_req, res) => {
  clearAdminCookie(res);
  res.json({ message: "Sesión cerrada." });
});

// Todas las rutas que cambian productos requieren una sesión administrativa válida.
app.post("/api/products", requireAdmin, (req, res) => {
  const validation = validateProduct(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });
  const p = validation.value;
  const result = db.prepare(`
    INSERT INTO products (nombre, formato, precio, descripcion, emoji)
    VALUES (@nombre, @formato, @precio, @descripcion, @emoji)
  `).run(p);
  res.status(201).json(getProduct.get(result.lastInsertRowid));
});

app.put("/api/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: "ID inválido." });
  const validation = validateProduct(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });
  const p = validation.value;
  const result = db.prepare(`
    UPDATE products
    SET nombre=@nombre, formato=@formato, precio=@precio,
        descripcion=@descripcion, emoji=@emoji, updated_at=CURRENT_TIMESTAMP
    WHERE id=@id
  `).run({ ...p, id });
  if (!result.changes) return res.status(404).json({ error: "Producto no encontrado." });
  res.json(getProduct.get(id));
});

app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: "ID inválido." });
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: "Producto no encontrado." });
  res.sendStatus(204);
});

app.use((err, _req, res, _next) => {
  console.error("Error inesperado:", err.message);
  res.status(500).json({ error: "Error interno del servidor." });
});

await ensureAdminFromEnvironment();
app.listen(port, () => {
  console.log(`MielWeb API escuchando en http://localhost:${port}`);
});
