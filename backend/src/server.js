import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { db } from "./db.js";
import { clearAdminCookie, createAdminCookie, requireAdmin } from "./auth.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const uploadsDir = path.resolve(process.env.UPLOADS_PATH || "./uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

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

// Fotos de productos: solo lectura pública.
app.use(
  "/api/uploads",
  express.static(uploadsDir, { index: false, dotfiles: "deny", maxAge: "7d" })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera 15 minutos e inténtalo nuevamente." }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 10 }
});

function recibirImagen(req, res, next) {
  upload.single("imagen")(req, res, (error) => {
    if (error) {
      const mensaje = error.code === "LIMIT_FILE_SIZE"
        ? "La imagen no debe superar 2 MB."
        : "No se pudo procesar la imagen.";
      return res.status(400).json({ error: mensaje });
    }
    next();
  });
}

// Se verifica el contenido real del archivo, no el tipo que declara el navegador.
function detectarTipoImagen(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  const firmaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(firmaPng)) {
    return "png";
  }
  if (buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

function guardarImagen(archivo) {
  const tipo = detectarTipoImagen(archivo.buffer);
  if (!tipo) return { error: "La imagen debe ser JPG, PNG o WebP." };
  const nombre = `${crypto.randomUUID()}.${tipo}`;
  fs.writeFileSync(path.join(uploadsDir, nombre), archivo.buffer);
  return { nombre };
}

function borrarImagen(nombre) {
  if (!nombre) return;
  try {
    fs.unlinkSync(path.join(uploadsDir, path.basename(nombre)));
  } catch {
    // El archivo ya no existe.
  }
}

const getProducts = db.prepare(`
  SELECT id, nombre, formato, precio, descripcion, emoji, imagen
  FROM products ORDER BY id DESC
`);
const getProduct = db.prepare(`
  SELECT id, nombre, formato, precio, descripcion, emoji, imagen
  FROM products WHERE id = ?
`);

function toProduct(fila) {
  return { ...fila, imagen: fila.imagen ? `/api/uploads/${fila.imagen}` : null };
}

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
  res.json(getProducts.all().map(toProduct));
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
app.post("/api/products", requireAdmin, recibirImagen, (req, res) => {
  const validation = validateProduct(req.body ?? {});
  if (validation.error) return res.status(400).json({ error: validation.error });

  let imagen = null;
  if (req.file) {
    const guardada = guardarImagen(req.file);
    if (guardada.error) return res.status(400).json({ error: guardada.error });
    imagen = guardada.nombre;
  }

  try {
    const result = db.prepare(`
      INSERT INTO products (nombre, formato, precio, descripcion, emoji, imagen)
      VALUES (@nombre, @formato, @precio, @descripcion, @emoji, @imagen)
    `).run({ ...validation.value, imagen });
    res.status(201).json(toProduct(getProduct.get(result.lastInsertRowid)));
  } catch (error) {
    borrarImagen(imagen);
    throw error;
  }
});

app.put("/api/products/:id", requireAdmin, recibirImagen, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: "ID inválido." });

  const actual = getProduct.get(id);
  if (!actual) return res.status(404).json({ error: "Producto no encontrado." });

  const body = req.body ?? {};
  const validation = validateProduct(body);
  if (validation.error) return res.status(400).json({ error: validation.error });

  let imagen = actual.imagen;
  if (req.file) {
    const guardada = guardarImagen(req.file);
    if (guardada.error) return res.status(400).json({ error: guardada.error });
    imagen = guardada.nombre;
  } else if (body.quitarImagen === "1") {
    imagen = null;
  }

  try {
    db.prepare(`
      UPDATE products
      SET nombre=@nombre, formato=@formato, precio=@precio,
          descripcion=@descripcion, emoji=@emoji, imagen=@imagen,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=@id
    `).run({ ...validation.value, imagen, id });
  } catch (error) {
    if (imagen !== actual.imagen) borrarImagen(imagen);
    throw error;
  }

  if (imagen !== actual.imagen) borrarImagen(actual.imagen);
  res.json(toProduct(getProduct.get(id)));
});

app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: "ID inválido." });

  const actual = getProduct.get(id);
  if (!actual) return res.status(404).json({ error: "Producto no encontrado." });

  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  borrarImagen(actual.imagen);
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