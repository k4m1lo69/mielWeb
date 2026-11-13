import axios from "axios";

const cliente = axios.create({
  baseURL: "/java-api",
  headers: {
    "Content-Type": "application/json",
  },
});

const configuracionAdmin = (usuario, password) => ({
  auth: { username: usuario, password },
});

export const listarProductosJava = () =>
  cliente.get("/productos").then((respuesta) => {
    const datos = respuesta.data;
    return Array.isArray(datos) ? datos : (datos?.value ?? []);
  });

export const consultarProductoJava = (id) =>
  cliente.get(`/productos/${id}`).then((respuesta) => respuesta.data);

export const crearProductoJava = (producto, usuario, password) =>
  cliente
    .post("/productos", producto, configuracionAdmin(usuario, password))
    .then((respuesta) => respuesta.data);

export const actualizarProductoJava = (id, producto, usuario, password) =>
  cliente
    .put(`/productos/${id}`, producto, configuracionAdmin(usuario, password))
    .then((respuesta) => respuesta.data);

export const eliminarProductoJava = (id, usuario, password) =>
  cliente.delete(
    `/productos/${id}`,
    configuracionAdmin(usuario, password)
  );

export default cliente;
