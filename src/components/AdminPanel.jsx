import { useRef, useState, useEffect } from "react";
import "./AdminPanel.css";
import * as api from "../utils/api";

const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO_FOTO = 2 * 1024 * 1024;

const formularioInicial = {
  nombre: "",
  formato: "500 g",
  precio: "",
  descripcion: "",
  emoji: "🍯",
};

const credencialesIniciales = { email: "", password: "" };

function AdminPanel({
  productos,
  onAgregar,
  onActualizar,
  onEliminar,
  onCerrar,
}) {
  const [admin, setAdmin] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [credenciales, setCredenciales] = useState(credencialesIniciales);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [idEdicion, setIdEdicion] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [imagenGuardada, setImagenGuardada] = useState(null);
  const [quitarImagen, setQuitarImagen] = useState(false);

  const inputFotoRef = useRef(null);
  const vistaPreviaRef = useRef(null);

  useEffect(() => {
    let activo = true;

    api
      .obtenerSesion()
      .then((datos) => {
        if (activo) setAdmin(datos.admin);
      })
      .catch(() => {
        // Sin sesión activa: se muestra el formulario de ingreso.
      })
      .finally(() => {
        if (activo) setVerificando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const liberarVistaPrevia = () => {
    if (vistaPreviaRef.current) {
      URL.revokeObjectURL(vistaPreviaRef.current);
      vistaPreviaRef.current = null;
    }

    setVistaPrevia(null);
  };

  const vaciarInputFoto = () => {
    if (inputFotoRef.current) {
      inputFotoRef.current.value = "";
    }
  };

  const reiniciarFoto = () => {
    liberarVistaPrevia();
    setImagenArchivo(null);
    setImagenGuardada(null);
    setQuitarImagen(false);
    vaciarInputFoto();
  };

  const manejarError = (error) => {
    if (error.estado === 401) {
      setAdmin(null);
      setMensaje("Tu sesión expiró. Inicia sesión nuevamente.");
      return;
    }

    setMensaje(error.message);
  };

  const cambiarCredencial = (evento) => {
    const { name, value } = evento.target;

    setCredenciales((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const cambiarFoto = (evento) => {
    const archivo = evento.target.files?.[0];

    if (!archivo) return;

    if (!TIPOS_FOTO.includes(archivo.type)) {
      setMensaje("La foto debe ser JPG, PNG o WebP.");
      vaciarInputFoto();
      return;
    }

    if (archivo.size > TAMANO_MAXIMO_FOTO) {
      setMensaje("La foto no debe superar 2 MB.");
      vaciarInputFoto();
      return;
    }

    liberarVistaPrevia();

    const url = URL.createObjectURL(archivo);
    vistaPreviaRef.current = url;

    setVistaPrevia(url);
    setImagenArchivo(archivo);
    setQuitarImagen(false);
    setMensaje("");
  };

  const quitarFoto = () => {
    if (imagenArchivo) {
      liberarVistaPrevia();
      setImagenArchivo(null);
      vaciarInputFoto();
      return;
    }

    if (imagenGuardada) {
      setQuitarImagen(true);
    }
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setIdEdicion(null);
    setMensaje("");
    reiniciarFoto();
  };

  const cerrarPanel = () => {
    liberarVistaPrevia();
    onCerrar();
  };

  const iniciarSesion = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setMensaje("");

    try {
      const datos = await api.iniciarSesion(
        credenciales.email.trim(),
        credenciales.password
      );

      setAdmin(datos.admin);
      setCredenciales(credencialesIniciales);
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setEnviando(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await api.cerrarSesion();
    } catch {
      // Si la sesión ya no era válida, igual se cierra el panel.
    }

    setAdmin(null);
    limpiarFormulario();
  };

  const guardarProducto = async (evento) => {
    evento.preventDefault();

    const nombre = formulario.nombre.trim();
    const precio = Number(formulario.precio);
    const descripcion = formulario.descripcion.trim();

    if (!nombre || !descripcion || !formulario.formato.trim()) {
      setMensaje("Completa todos los campos del producto.");
      return;
    }

    if (!Number.isSafeInteger(precio) || precio <= 0) {
      setMensaje("Ingresa un precio entero mayor que cero.");
      return;
    }

    const producto = {
      nombre,
      formato: formulario.formato.trim(),
      precio,
      descripcion,
      emoji: formulario.emoji.trim() || "🍯",
    };

    setEnviando(true);

    try {
      if (idEdicion !== null) {
        await onActualizar(idEdicion, producto, imagenArchivo, quitarImagen);
        setMensaje("Producto actualizado.");
      } else {
        await onAgregar(producto, imagenArchivo);
        setMensaje("Producto agregado.");
      }

      setFormulario(formularioInicial);
      setIdEdicion(null);
      reiniciarFoto();
    } catch (error) {
      manejarError(error);
    } finally {
      setEnviando(false);
    }
  };

  const editarProducto = (producto) => {
    setFormulario({
      nombre: producto.nombre,
      formato: producto.formato,
      precio: String(producto.precio),
      descripcion: producto.descripcion,
      emoji: producto.emoji || "🍯",
    });

    reiniciarFoto();
    setImagenGuardada(producto.imagen || null);
    setIdEdicion(producto.id);
    setMensaje("");
  };

  const eliminarProducto = async (producto) => {
    const confirmar = window.confirm(
      `¿Eliminar ${producto.nombre} del catálogo?`
    );

    if (!confirmar) return;

    try {
      await onEliminar(producto.id);

      if (idEdicion === producto.id) {
        limpiarFormulario();
      }

      setMensaje("Producto eliminado.");
    } catch (error) {
      manejarError(error);
    }
  };

  const fotoMostrada =
    vistaPrevia || (imagenGuardada && !quitarImagen ? imagenGuardada : null);

  let contenido;

  if (verificando) {
    contenido = <p className="admin-aviso">Verificando sesión...</p>;
  } else if (!admin) {
    contenido = (
      <form className="admin-formulario" onSubmit={iniciarSesion}>
        <h3>Iniciar sesión</h3>

        <label>
          Correo
          <input
            name="email"
            type="email"
            autoComplete="username"
            value={credenciales.email}
            onChange={cambiarCredencial}
            required
          />
        </label>

        <label>
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={credenciales.password}
            onChange={cambiarCredencial}
            required
          />
        </label>

        {mensaje && (
          <p className="admin-mensaje" role="status">
            {mensaje}
          </p>
        )}

        <div className="admin-acciones">
          <button className="admin-guardar" type="submit" disabled={enviando}>
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </form>
    );
  } else {
    contenido = (
      <>
        <form className="admin-formulario" onSubmit={guardarProducto}>
          <h3>{idEdicion !== null ? "Editar producto" : "Agregar producto"}</h3>

          <label>
            Nombre
            <input
              name="nombre"
              value={formulario.nombre}
              onChange={cambiarCampo}
              maxLength={80}
              required
            />
          </label>

          <label>
            Formato
            <input
              name="formato"
              value={formulario.formato}
              onChange={cambiarCampo}
              maxLength={30}
              required
            />
          </label>

          <label>
            Precio en pesos chilenos
            <input
              name="precio"
              type="number"
              min="1"
              step="1"
              value={formulario.precio}
              onChange={cambiarCampo}
              required
            />
          </label>

          <label>
            Emoji representativo
            <input
              name="emoji"
              value={formulario.emoji}
              onChange={cambiarCampo}
              maxLength={8}
            />
          </label>

          <label className="admin-campo-completo">
            Descripción
            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={cambiarCampo}
              maxLength={300}
              rows={3}
              required
            />
          </label>

          <div className="admin-campo-completo">
            <label>
              Foto del producto (opcional)
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={cambiarFoto}
              />
            </label>
            <span className="admin-foto-ayuda">
              JPG, PNG o WebP, hasta 2 MB. Si no hay foto, se muestra el emoji.
            </span>

            {fotoMostrada && (
              <>
                <img
                  className="admin-foto-vista"
                  src={fotoMostrada}
                  alt="Vista previa de la foto del producto"
                />
                <button
                  className="admin-quitar-foto"
                  type="button"
                  onClick={quitarFoto}
                >
                  {vistaPrevia ? "Descartar foto elegida" : "Quitar foto actual"}
                </button>
              </>
            )}

            {quitarImagen && !vistaPrevia && (
              <span className="admin-foto-ayuda">
                La foto se quitará al guardar los cambios.
              </span>
            )}
          </div>

          {mensaje && (
            <p className="admin-mensaje" role="status">
              {mensaje}
            </p>
          )}

          <div className="admin-acciones">
            <button
              className="admin-guardar"
              type="submit"
              disabled={enviando}
            >
              {enviando
                ? "Guardando..."
                : idEdicion !== null
                  ? "Guardar cambios"
                  : "Agregar producto"}
            </button>

            {idEdicion !== null && (
              <button
                className="admin-cancelar"
                type="button"
                onClick={limpiarFormulario}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        <div className="admin-listado">
          <h3>Productos registrados: {productos.length}</h3>

          {productos.length === 0 ? (
            <p>No hay productos registrados.</p>
          ) : (
            productos.map((producto) => (
              <article className="admin-producto" key={producto.id}>
                {producto.imagen ? (
                  <img
                    className="admin-producto-miniatura"
                    src={producto.imagen}
                    alt=""
                  />
                ) : (
                  <span className="admin-producto-emoji" aria-hidden="true">
                    {producto.emoji || "🍯"}
                  </span>
                )}

                <div className="admin-producto-info">
                  <strong>{producto.nombre}</strong>
                  <span>{producto.formato}</span>
                  <span>
                    {producto.precio.toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>

                <div className="admin-producto-acciones">
                  <button
                    type="button"
                    onClick={() => editarProducto(producto)}
                  >
                    Editar
                  </button>

                  <button
                    className="admin-eliminar"
                    type="button"
                    onClick={() => eliminarProducto(producto)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </>
    );
  }

  return (
    <div className="admin-fondo">
      <section className="admin-panel" aria-labelledby="titulo-admin">
        <div className="admin-encabezado">
          <div>
            <span className="etiqueta">GESTIÓN DE LA TIENDA</span>
            <h2 id="titulo-admin">Panel de administración</h2>
            <p>
              {admin
                ? `Sesión iniciada como ${admin.email}.`
                : "Inicia sesión para administrar los productos."}
            </p>
          </div>

          <div>
            {admin && (
              <button
                className="admin-cerrar"
                type="button"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            )}

            <button className="admin-cerrar" type="button" onClick={cerrarPanel}>
              Volver a la tienda
            </button>
          </div>
        </div>

        {contenido}
      </section>
    </div>
  );
}

export default AdminPanel;
