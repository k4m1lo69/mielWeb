import jwt from "jsonwebtoken";

const COOKIE_NAME = "mielweb_admin";

export function createAdminCookie(res, admin) {
  const token = jwt.sign(
    { sub: String(admin.id), email: admin.email, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "2h", issuer: "mielweb-api", audience: "mielweb-admin" }
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 60 * 60 * 1000,
    path: "/"
  });
}

export function clearAdminCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
  });
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Debes iniciar sesión como administrador." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "mielweb-api",
      audience: "mielweb-admin"
    });
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "No tienes permisos para esta acción." });
    }
    req.admin = { id: Number(payload.sub), email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "La sesión expiró o no es válida. Inicia sesión nuevamente." });
  }
}
