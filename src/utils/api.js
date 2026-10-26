async function solicitar(ruta, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`/api${ruta}`, {
      credentials: "same-origin",
      ...opciones,
      headers: opciones.body
        ? { "Content-Type": "application/json" }
        : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (respuesta.status === 204) return null;

  let datos;

  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    const error = new Error(
      datos?.error || "No se pudo completar la solicitud."
    );
    error.estado = respuesta.status;
    throw error;
  }

  return datos;
}

export const obtenerProductos = () => solicitar("/products");

export const obtenerSesion = () => solicitar("/auth/me");

export const iniciarSesion = (email, password) =>
  solicitar("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const cerrarSesion = () => solicitar("/auth/logout", { method: "POST" });

export const crearProducto = (producto) =>
  solicitar("/products", {
    method: "POST",
    body: JSON.stringify(producto),
  });

export const actualizarProducto = (id, producto) =>
  solicitar(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(producto),
  });

export const eliminarProducto = (id) =>
  solicitar(`/products/${id}`, { method: "DELETE" });