import { useCallback, useEffect, useState } from "react";
import * as javaApi from "../utils/javaApi";
import "./SpringBootProductos.css";

const formularioInicial = {
  nombre: "",
  formato: "",
  precio: "",
  descripcion: "",
  stock: "0",
  categoria: "General",
  emoji: "🍯",
  imagen: "",
};

const mensajeError = (error) => {
  if (!error.response) {
    return "No se pudo conectar con Spring Boot. Verifica que el servidor Java esté iniciado y vuelve a intentarlo.";
  }

  if (error.response?.status === 401) {
    return "Credenciales incorrectas. Verifica el usuario y contraseña del administrador Java.";
  }

  if (error.response?.status === 403) {
    return "No tienes permisos para realizar esta operación.";
  }

  if (error.response?.status === 400) {
    return "Los datos no son válidos. Revisa los campos e intenta nuevamente.";
  }

  if (error.response?.status === 404) {
    return "El producto solicitado no existe.";
  }

  return error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    "No se pudo completar la operación.";
};

function SpringBootProductos({ onCerrar, onProductosChange }) {
  const [productos, setProductos] = useState([]);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [idEdicion, setIdEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  const mostrarMensaje = (texto, tipo = "info") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const cargarProductos = useCallback(async () => {
    setCargando(true);

    try {
      const datos = await javaApi.listarProductosJava();
      setProductos(datos);
      onProductosChange?.(datos);
      mostrarMensaje("Productos cargados desde Spring Boot.", "exito");
    } catch (error) {
      mostrarMensaje(mensajeError(error), "error");
    } finally {
      setCargando(false);
    }
  }, [onProductosChange]);

  useEffect(() => {
    Promise.resolve().then(cargarProductos);
  }, [cargarProductos]);

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const abrirNuevo = () => {
    setFormulario(formularioInicial);
    setIdEdicion(null);
    setMensaje("");
    setMostrarModal(true);
  };

  const consultarParaEditar = async (id) => {
    setCargando(true);

    try {
      const producto = await javaApi.consultarProductoJava(id);

      setFormulario({
        nombre: producto.nombre || "",
        formato: producto.formato || "",
        precio: String(producto.precio ?? ""),
        descripcion: producto.descripcion || "",
        stock: String(producto.stock ?? 0),
        categoria: producto.categoria || "General",
        emoji: producto.emoji || "🍯",
        imagen: producto.imagen || "",
      });

      setIdEdicion(id);
      setMostrarModal(true);
      mostrarMensaje("Producto consultado por ID.", "exito");
    } catch (error) {
      mostrarMensaje(mensajeError(error), "error");
    } finally {
      setCargando(false);
    }
  };

  const guardarProducto = async (evento) => {
    evento.preventDefault();

    if (!usuario.trim() || !password) {
      mostrarMensaje(
        "Ingresa las credenciales del administrador Java para guardar.",
        "error"
      );
      return;
    }

    const precio = Number(formulario.precio);

    if (!Number.isSafeInteger(precio) || precio <= 0) {
      mostrarMensaje("El precio debe ser un número entero mayor que cero.", "error");
      return;
    }

    const stock = Number(formulario.stock);

    if (!Number.isSafeInteger(stock) || stock < 0) {
      mostrarMensaje("El stock debe ser un número entero igual o mayor que cero.", "error");
      return;
    }

    const producto = {
      nombre: formulario.nombre.trim(),
      formato: formulario.formato.trim(),
      precio,
      descripcion: formulario.descripcion.trim(),
      stock,
      categoria: formulario.categoria.trim(),
      emoji: formulario.emoji.trim() || "🍯",
      imagen: formulario.imagen.trim() || null,
    };

    if (
      !producto.nombre ||
      !producto.formato ||
      !producto.descripcion ||
      !producto.categoria
    ) {
      mostrarMensaje("Completa nombre, formato y descripción.", "error");
      return;
    }

    setCargando(true);

    try {
      if (idEdicion === null) {
        await javaApi.crearProductoJava(producto, usuario.trim(), password);
        mostrarMensaje("Producto creado correctamente con POST.", "exito");
      } else {
        await javaApi.actualizarProductoJava(
          idEdicion,
          producto,
          usuario.trim(),
          password
        );
        mostrarMensaje("Producto actualizado correctamente con PUT.", "exito");
      }

      setMostrarModal(false);
      setFormulario(formularioInicial);
      setIdEdicion(null);
      await cargarProductos();
    } catch (error) {
      mostrarMensaje(mensajeError(error), "error");
    } finally {
      setCargando(false);
    }
  };

  const eliminarProducto = async (producto) => {
    if (!usuario.trim() || !password) {
      mostrarMensaje(
        "Ingresa las credenciales del administrador Java antes de eliminar.",
        "error"
      );
      return;
    }

    if (!window.confirm(`¿Eliminar "${producto.nombre}"?`)) return;

    setCargando(true);

    try {
      await javaApi.eliminarProductoJava(
        producto.id,
        usuario.trim(),
        password
      );

      mostrarMensaje("Producto eliminado correctamente con DELETE.", "exito");
      await cargarProductos();
    } catch (error) {
      mostrarMensaje(mensajeError(error), "error");
    } finally {
      setCargando(false);
    }
  };

  const cerrarModal = () => {
    if (cargando) return;
    setMostrarModal(false);
    setFormulario(formularioInicial);
    setIdEdicion(null);
  };

  const formatoPrecio = (precio) =>
    Number(precio).toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  return (
    <div className="java-fondo" role="presentation">
      <section
        className="java-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="java-titulo"
      >
        <header className="java-encabezado">
          <div>
            <span className="java-etiqueta">INTEGRACIÓN ACADÉMICA · DUOC UC</span>
            <h2 id="java-titulo">CRUD de productos con Spring Boot</h2>
            <p>React + Axios + API REST + Java</p>
          </div>

          <button
            className="java-cerrar"
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            aria-label="Cerrar módulo"
          >
            ×
          </button>
        </header>

        <section className="java-credenciales">
          <h3>Autenticación del administrador Java</h3>
          <div className="java-credenciales-campos">
            <label>
              Usuario
              <input
                autoComplete="username"
                value={usuario}
                onChange={(evento) => setUsuario(evento.target.value)}
                placeholder="Usuario administrador"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                placeholder="Contraseña"
              />
            </label>
          </div>
          <small>
            Las credenciales se mantienen solamente en el estado de este
            componente y se envían mediante HTTP Basic al realizar escrituras.
          </small>
        </section>

        {mensaje && (
          <p className={`java-mensaje java-mensaje-${tipoMensaje}`} role="status">
            {mensaje}
          </p>
        )}

        <div className="java-acciones-superiores">
          <div>
            <h3>Productos registrados</h3>
            <span>{productos.length} productos en la API Java</span>
          </div>

          <div className="java-botones">
            <button
              type="button"
              className="java-boton java-boton-secundario"
              onClick={cargarProductos}
              disabled={cargando}
            >
              Actualizar lista
            </button>

            <button
              type="button"
              className="java-boton java-boton-principal"
              onClick={abrirNuevo}
              disabled={cargando}
            >
              + Agregar producto
            </button>
          </div>
        </div>

        <div className="java-tabla-contenedor">
          <table className="java-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Formato</th>
                <th>Precio</th>
                <th>Descripción</th>
                <th>Stock</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.id}</td>
                  <td>
                    <span className="java-nombre-producto">
                      {producto.emoji || "🍯"} {producto.nombre}
                    </span>
                  </td>
                  <td>{producto.formato}</td>
                  <td>{formatoPrecio(producto.precio)}</td>
                  <td>{producto.descripcion}</td>
                  <td>{producto.stock ?? 0}</td>
                  <td>{producto.categoria || "General"}</td>
                  <td>
                    <div className="java-acciones-fila">
                      <button
                        type="button"
                        onClick={() => consultarParaEditar(producto.id)}
                        disabled={cargando}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="java-eliminar"
                        onClick={() => eliminarProducto(producto)}
                        disabled={cargando}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!cargando && productos.length === 0 && (
                <tr>
                  <td colSpan="8" className="java-vacio">
                    No hay productos registrados en Spring Boot.
                  </td>
                </tr>
              )}

              {cargando && (
                <tr>
                  <td colSpan="8" className="java-vacio">
                    Procesando solicitud...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="java-pie">
          <span>API: /java-api/productos</span>
          <span>GET · POST · PUT · DELETE</span>
        </footer>
      </section>

      {mostrarModal && (
        <div className="java-modal-fondo">
          <section
            className="java-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="java-modal-titulo"
          >
            <header className="java-modal-encabezado">
              <h3 id="java-modal-titulo">
                {idEdicion === null ? "Agregar producto" : `Editar producto #${idEdicion}`}
              </h3>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={cargando}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </header>

            <form onSubmit={guardarProducto} className="java-formulario">
              <label>
                Nombre
                <input
                  name="nombre"
                  value={formulario.nombre}
                  onChange={cambiarCampo}
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Formato / presentación
                <input
                  name="formato"
                  value={formulario.formato}
                  onChange={cambiarCampo}
                  maxLength={40}
                  placeholder="Ej.: 500 g"
                  required
                />
              </label>

              <label>
                Stock disponible
                <input
                  name="stock"
                  type="number"
                  min="0"
                  max="10000000"
                  step="1"
                  value={formulario.stock}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                Categoría
                <input
                  name="categoria"
                  value={formulario.categoria}
                  onChange={cambiarCampo}
                  maxLength={80}
                  placeholder="Ej.: Miel"
                  required
                />
              </label>

              <label>
                Precio en pesos chilenos
                <input
                  name="precio"
                  type="number"
                  min="1"
                  max="100000000"
                  step="1"
                  value={formulario.precio}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                Emoji / categoría visual
                <input
                  name="emoji"
                  value={formulario.emoji}
                  onChange={cambiarCampo}
                  maxLength={8}
                />
              </label>

              <label className="java-campo-completo">
                Descripción
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={cambiarCampo}
                  maxLength={1000}
                  rows={3}
                  required
                />
              </label>

              <label className="java-campo-completo">
                URL de imagen (opcional)
                <input
                  name="imagen"
                  type="url"
                  value={formulario.imagen}
                  onChange={cambiarCampo}
                  maxLength={255}
                  placeholder="https://..."
                />
              </label>

              <div className="java-modal-acciones">
                <button
                  type="button"
                  className="java-boton java-boton-secundario"
                  onClick={cerrarModal}
                  disabled={cargando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="java-boton java-boton-principal"
                  disabled={cargando}
                >
                  {cargando
                    ? "Guardando..."
                    : idEdicion === null
                      ? "Guardar producto"
                      : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default SpringBootProductos;
