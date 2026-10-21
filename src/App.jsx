import "./App.css";

const  productos = [
  {
    id: 1,
    nombre: "Miel Multiflora",
    formato: "500g",
    precio: 5000,
    descripcion: "Miel de flores variadas, ideal para endulzar tus bebidas y postres.",
    emojin: "🍯" ,
  },
  {
    id: 2,
    nombre: "Miel de Ulmo",
    formato: "500g",
    precio: 6000,
    descripcion: "Miel de Ulmo, con un sabor único y propiedades medicinales.",
    emojin: "🌿", 
  },
  {
    id: 3,
    nombre: "Miel de Quillay",
    formato: "500g",
    precio: 5500,
    descripcion: "Miel de Quillay, con un sabor suave y delicado.",
    emojin: "🌸", 
  },
];

function App() {
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

        <a className="boton boton-pequeno" href="#productos">
          Ver productos
        </a>
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
            <h2>Productos destacados</h2>
            <p>Encuentra tu formato favorito.</p>
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
                    <strong>
                      {producto.precio.toLocaleString("es-CL", {
                        style: "currency",
                        currency: "CLP",
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                    <a
                      href="#contacto"
                      aria-label={`Consultar por ${producto.nombre}`}
                    >
                      Consultar →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="nota-precios">
            Precios de ejemplo para el diseño. Confirma los formatos,
            valores y disponibilidad antes de publicar la tienda.
          </p>
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
              sencilla, cálida y cercana. Conoce nuestros productos y
              consulta por el formato que buscas.
            </p>
            <a className="enlace-secundario" href="#contacto">
              Hablemos de tu pedido →
            </a>
          </div>
        </section>

        <section className="contacto" id="contacto">
          <span className="etiqueta">ESTAMOS PARA AYUDARTE</span>
          <h2>¿Te gustaría hacer un pedido?</h2>
          <p>
            Escríbenos para consultar precios, disponibilidad y opciones
            de entrega.
          </p>
          <a
            className="boton"
            href="mailto:contacto@mielweb.cl?subject=Consulta%20por%20miel"
          >
            Consultar por correo
          </a>
          <small>
            El correo es provisional. Reemplázalo por el correo real
            del negocio antes de publicar.
          </small>
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
    </>
  );
}

export default App;