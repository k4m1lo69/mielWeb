async function solicitar(ruta, opciones = {}) {
  const esTexto = typeof opciones.body === "string";
  let respuesta;

  try {
    respuesta = await fetch(`/api${ruta}`, {
      credentials: "same-origin",
      ...opciones,
      headers: esTexto ? { "Content-Type": "application/json" } : undefined,
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

function construirFormulario(producto, imagen, quitarImagen) {
  const datos = new FormData();

  datos.append("nombre", producto.nombre);
  datos.append("formato", producto.formato);
  datos.append("precio", String(producto.precio));
  datos.append("descripcion", producto.descripcion);
  datos.append("emoji", producto.emoji);

  if (quitarImagen) datos.append("quitarImagen", "1");
  if (imagen) datos.append("imagen", imagen);

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

export const crearProducto = (producto, imagen = null) =>
  solicitar("/products", {
    method: "POST",
    body: construirFormulario(producto, imagen, false),
  });

export const actualizarProducto = (
  id,
  producto,
  imagen = null,
  quitarImagen = false
) =>
  solicitar(`/products/${id}`, {
    method: "PUT",
    body: construirFormulario(producto, imagen, quitarImagen),
  });

export const eliminarProducto = (id) =>
  solicitar(`/products/${id}`, { method: "DELETE" });