
import { useState } from "react";
import "./AdminPanel.css";

function AdminPanel({
  productos,
  onAgregar,
  onActualizar,
  onEliminar,
  onCerrar,
}) {
  const formularioInicial = {
    nombre: "",
    formato: "500 g",
    precio: "",
    descripcion: "",
    emoji: "🍯",
  };

  const [formulario, setFormulario] = useState(formularioInicial);
  const [idEdicion, setIdEdicion] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setIdEdicion(null);
    setMensaje("");
  };

  const guardarProducto = (evento) => {
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

    if (idEdicion !== null) {
      onActualizar({ ...producto, id: idEdicion });
      setMensaje("Producto actualizado en esta sesión.");
    } else {
      onAgregar({
        ...producto,
        id: Date.now(),
      });
      setMensaje("Producto agregado en esta sesión.");
    }

    setFormulario(formularioInicial);
    setIdEdicion(null);
  };

  const editarProducto = (producto) => {
    setFormulario({
      nombre: producto.nombre,
      formato: producto.formato,
      precio: String(producto.precio),
      descripcion: producto.descripcion,
      emoji: producto.emoji || "🍯",
    });

    setIdEdicion(producto.id);
    setMensaje("");
  };

  return (
    <div className="admin-fondo">
      <section className="admin-panel" aria-labelledby="titulo-admin">
        <div className="admin-encabezado">
          <div>
            <span className="etiqueta">GESTIÓN DE LA TIENDA</span>
            <h2 id="titulo-admin">Panel de administración</h2>
            <p>Administra los productos de MielWeb.</p>
          </div>

          <button
            className="admin-cerrar"
            type="button"
            onClick={onCerrar}
          >
            Volver a la tienda
          </button>
        </div>

        <p className="admin-aviso">
          Versión de prueba: los cambios solo se mantienen en la memoria
          mientras la página está abierta. Este panel todavía no tiene
          inicio de sesión ni protección de acceso.
        </p>

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

          {mensaje && (
            <p className="admin-mensaje" role="status">
              {mensaje}
            </p>
          )}

          <div className="admin-acciones">
            <button className="admin-guardar" type="submit">
              {idEdicion !== null ? "Guardar cambios" : "Agregar producto"}
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
                <span className="admin-producto-emoji" aria-hidden="true">
                  {producto.emoji || "🍯"}
                </span>

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
                    onClick={() => {
                      const confirmar = window.confirm(
                        `¿Eliminar ${producto.nombre} del catálogo?`
                      );

                      if (confirmar) {
                        onEliminar(producto.id);

                        if (idEdicion === producto.id) {
                          limpiarFormulario();
                        }

                        setMensaje("Producto eliminado de esta sesión.");
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminPanel;
