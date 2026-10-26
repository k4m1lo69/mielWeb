import { useEffect, useState } from "react";
import "./App.css";
import AdminPanel from "./components/AdminPanel";

const WHATSAPP = "56941946907";

const productosIniciales = [
  {
    id: 1,
    nombre: "Miel Multiflora",
    formato: "500 g",
    precio: 5000,
    descripcion: "Miel de flores variadas, ideal para bebidas y postres.",
    emoji: "🍯",
  },
  {
    id: 2,
    nombre: "Miel de Ulmo",
    formato: "500 g",
    precio: 6000,
    descripcion: "Miel de aroma intenso y sabor característico.",
    emoji: "🌿",
  },
  {
    id: 3,
    nombre: "Miel de Quillay",
    formato: "500 g",
    precio: 5500,
    descripcion: "Una miel de sabor suave para disfrutar cada día.",
    emoji: "🌼",
  },
];

const formatoPrecio = (precio) =>
  precio.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

function App() {
  const [carrito, setCarrito] = useState([]);
  const [productos, setProductos] = useState(() => {
    try {
      const productosGuardados = localStorage.getItem("mielweb_productos");

      return productosGuardados
        ? JSON.parse(productosGuardados)
        : productosIniciales;
    } catch {
      return productosIniciales;
    }
  });
  const [mostrarAdmin, setMostrarAdmin] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("mielweb_productos", JSON.stringify(productos));
    } catch (error) {
      console.error("No se pudieron guardar los productos en el navegador:", error);
    }
  }, [productos]);

  const agregarAlCarrito = (producto) => {
    setCarrito((actual) => {
      const existe = actual.find((item) => item.id === producto.id);

      if (existe) {
        return actual.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [...actual, { ...producto, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, cambio) => {
    setCarrito((actual) =>
      actual
        .map((item) =>
          item.id === id
            ? { ...item, cantidad: item.cantidad + cambio }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const agregarProducto = (producto) => {
    setProductos((actuales) => [...actuales, producto]);
  };

  const actualizarProducto = (productoActualizado) => {
    setProductos((actuales) =>
      actuales.map((producto) =>
        producto.id === productoActualizado.id
          ? productoActualizado
          : producto
      )
    );

    setCarrito((actuales) =>
      actuales.map((item) =>
        item.id === productoActualizado.id
          ? { ...item, ...productoActualizado }
          : item
      )
    );
  };

  const eliminarProducto = (id) => {
    setProductos((actuales) =>
      actuales.filter((producto) => producto.id !== id)
    );

    setCarrito((actuales) =>
      actuales.filter((item) => item.id !== id)
    );
  };

  const quitarDelCarrito = (id) => {
    setCarrito((actuales) => actuales.filter((item) => item.id !== id));
  };

  const cantidadTotal = carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const precioTotal = carrito.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  const prepararPedidoWhatsApp = () => {
    if (carrito.length === 0) return;

    const lineasPedido = carrito.map(
      (item) =>
        `- ${item.nombre} (${item.formato}) x ${item.cantidad}: ${formatoPrecio(
          item.precio * item.cantidad
        )}`
    );

    const mensaje = [
      "¡Hola! Quiero consultar por este pedido de MielWeb:",
      "",
      ...lineasPedido,
      "",
      `Total de productos: ${cantidadTotal}`,
      `Total estimado: ${formatoPrecio(precioTotal)}`,
      "",
      "Quisiera confirmar disponibilidad y coordinar la entrega.",
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <header className="encabezado">
        <a className="marca" href="#inicio" aria-label="MielWeb, inicio">
          <span className="marca-icono">🍯</span>
          <span>MielWeb</span>
        </a>

        <nav className="navegacion" aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <a href="#productos">Productos</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className="acciones-encabezado">
          <button
            className="boton boton-pequeno"
            type="button"
            onClick={() => setMostrarAdmin(true)}
          >
            ⚙ Administración
          </button>

          <a className="boton boton-pequeno boton-carrito" href="#carrito">
            🛒 Carrito ({cantidadTotal})
          </a>
        </div>
      </header>

      <main>
        <section className="portada" id="inicio">
          <div className="portada-contenido">
            <span className="etiqueta">UN REGALO DE LA NATURALEZA</span>
            <h1>
              El dulce sabor de lo <span>natural</span>
            </h1>
            <p>
              Descubre nuestra selección de miel y disfruta un producto
              ideal para acompañar tus momentos especiales.
            </p>

            <div className="portada-acciones">
              <a className="boton" href="#productos">
                Descubrir productos
              </a>
              <a className="enlace-secundario" href="#nosotros">
                Conoce nuestra propuesta →
              </a>
            </div>

            <div className="dato-portada">
              <span>🐝</span>
              <p>Un toque natural para tu día</p>
            </div>
          </div>

          <div className="portada-imagen" aria-label="Ilustración de miel">
            <div className="circulo-decorativo"></div>
            <div className="tarro-miel" role="img" aria-label="Frasco de miel">
              🍯
            </div>
            <span className="decoracion decoracion-uno">✿</span>
            <span className="decoracion decoracion-dos">✿</span>
            <div className="nota-imagen">
              <span>100%</span>
              <span>Disfrute natural</span>
            </div>
          </div>
        </section>

        <section className="beneficios" aria-label="Características">
          <article>
            <span>🌻</span>
            <div>
              <h2>Sabor natural</h2>
              <p>Para acompañar tu mesa.</p>
            </div>
          </article>
          <article>
            <span>🍯</span>
            <div>
              <h2>Distintos formatos</h2>
              <p>Opciones para cada ocasión.</p>
            </div>
          </article>
          <article>
            <span>📦</span>
            <div>
              <h2>Consulta por envíos</h2>
              <p>Coordinemos tu pedido.</p>
            </div>
          </article>
        </section>

        <section className="seccion-productos" id="productos">
          <div className="titulo-seccion">
            <span className="etiqueta">NUESTRA SELECCIÓN</span>
            <h2>Nuestras mieles</h2>
            <p>Elige tus productos y agrégalos al carrito.</p>
          </div>

          <div className="rejilla-productos">
            {productos.map((producto) => (
              <article className="tarjeta-producto" key={producto.id}>
                <div className="producto-imagen" aria-hidden="true">
                  <span>{producto.emoji}</span>
                </div>

                <div className="producto-informacion">
                  <span className="producto-formato">{producto.formato}</span>
                  <h3>{producto.nombre}</h3>
                  <p>{producto.descripcion}</p>

                  <div className="producto-pie">
                    <strong>{formatoPrecio(producto.precio)}</strong>
                    <button
                      className="boton boton-agregar"
                      type="button"
                      onClick={() => agregarAlCarrito(producto)}
                      aria-label={`Agregar ${producto.nombre} al carrito`}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="nota-precios">
            Precios de ejemplo. Confirma los valores, formatos y disponibilidad
            antes de publicar la tienda.
          </p>
        </section>

        <section className="seccion-carrito" id="carrito">
          <div className="titulo-seccion">
            <span className="etiqueta">TU SELECCIÓN</span>
            <h2>Carrito de compras</h2>
            <p>Revisa tu pedido antes de contactarnos por WhatsApp.</p>
          </div>

          {carrito.length === 0 ? (
            <div className="carrito-vacio">
              <span aria-hidden="true">🧺</span>
              <h3>Tu carrito está vacío</h3>
              <p>Agrega tus mieles favoritas para preparar tu pedido.</p>
              <a className="boton" href="#productos">
                Ver productos
              </a>
            </div>
          ) : (
            <>
              <div className="lista-carrito">
                {carrito.map((item) => (
                  <article className="item-carrito" key={item.id}>
                    <span className="carrito-emoji" aria-hidden="true">
                      {item.emoji}
                    </span>

                    <div className="carrito-detalle">
                      <h3>{item.nombre}</h3>
                      <p>
                        {item.formato} · {formatoPrecio(item.precio)} por unidad
                      </p>
                      <strong>
                        {formatoPrecio(item.precio * item.cantidad)}
                      </strong>
                    </div>

                    <div
                      className="control-cantidad"
                      aria-label={`Cantidad de ${item.nombre}`}
                    >
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(item.id, -1)}
                        aria-label={`Disminuir cantidad de ${item.nombre}`}
                      >
                        −
                      </button>
                      <span>{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(item.id, 1)}
                        aria-label={`Aumentar cantidad de ${item.nombre}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="boton-eliminar"
                      type="button"
                      onClick={() => quitarDelCarrito(item.id)}
                    >
                      Eliminar
                    </button>
                  </article>
                ))}
              </div>

              <div className="resumen-carrito">
                <p>
                  Cantidad total de productos: <strong>{cantidadTotal}</strong>
                </p>
                <p className="total-carrito">
                  Total estimado: <strong>{formatoPrecio(precioTotal)}</strong>
                </p>
                <p className="aviso-carrito">
                  El precio no incluye envío. La disponibilidad y la entrega
                  se confirman por WhatsApp.
                </p>
                <button
                  className="boton boton-whatsapp"
                  type="button"
                  onClick={prepararPedidoWhatsApp}
                >
                  Enviar pedido por WhatsApp ↗
                </button>
              </div>
            </>
          )}
        </section>

        <section className="historia" id="nosotros">
          <div className="historia-icono" aria-hidden="true">
            🌼
          </div>
          <div>
            <span className="etiqueta">SOBRE MIELWEB</span>
            <h2>Una propuesta inspirada en la naturaleza</h2>
            <p>
              Queremos acercarte al mundo de la miel con una experiencia
              sencilla, cálida y cercana. Elige tus productos y conversemos
              para coordinar tu pedido.
            </p>
            <a className="enlace-secundario" href="#productos">
              Conoce nuestras mieles →
            </a>
          </div>
        </section>

        <section className="contacto" id="contacto">
          <span className="etiqueta">ESTAMOS PARA AYUDARTE</span>
          <h2>¿Tienes alguna consulta?</h2>
          <p>
            Escríbenos por WhatsApp para consultar precios, disponibilidad y
            opciones de entrega.
          </p>
          <a
            className="boton boton-whatsapp"
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
              "¡Hola! Quisiera consultar por los productos de MielWeb."
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Consultar por WhatsApp ↗
          </a>
        </section>
      </main>

      <footer className="pie-pagina">
        <a className="marca" href="#inicio">
          <span className="marca-icono">🍯</span>
          <span>MielWeb</span>
        </a>
        <p>Una experiencia inspirada en la naturaleza.</p>
        <span>© {new Date().getFullYear()} MielWeb</span>
      </footer>

      {mostrarAdmin && (
        <AdminPanel
          productos={productos}
          onAgregar={agregarProducto}
          onActualizar={actualizarProducto}
          onEliminar={eliminarProducto}
          onCerrar={() => setMostrarAdmin(false)}
        />
      )}
    </>
  );
}

export default App;