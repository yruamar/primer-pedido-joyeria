import { useCallback, useEffect, useMemo, useState } from "react";

import { cargarProductos, filtrar, hermanosDe } from "./datos.js";
import {
  borrarVentas,
  cargarVentas,
  conVenta,
  guardarVentas,
  sincronizarVersion,
  sinVenta,
} from "./ventas.js";
import { precalentar } from "./escaner.js";

import Buscador from "./componentes/Buscador.jsx";
import Lista from "./componentes/Lista.jsx";
import Detalle from "./componentes/Detalle.jsx";
import Escaner from "./componentes/Escaner.jsx";
import Exportar from "./componentes/Exportar.jsx";

export default function App() {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState("");

  const [pestana, setPestana] = useState("productos"); // productos | exportar
  const [consulta, setConsulta] = useState("");
  const [grupo, setGrupo] = useState(null); // filtro por CodigoGrupo
  const [seleccionado, setSeleccionado] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const [reiniciado, setReiniciado] = useState(false);

  // Carga inicial: catalogo + ventas guardadas.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { version, productos: lista } = await cargarProductos();
        // Antes de leer las ventas: si el catalogo es nuevo, los id ya no
        // designan los mismos productos y el contador se pone a cero.
        const hubo = await sincronizarVersion(version);
        const guardadas = await cargarVentas();
        if (!vivo) return;
        setProductos(lista);
        setVentas(guardadas);
        setReiniciado(hubo);
      } catch (error) {
        if (vivo) setFallo(error.message);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    // Deja el wasm del lector listo para que el primer escaneo no espere.
    precalentar();
    return () => {
      vivo = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const porGrupo = grupo ? productos.filter((p) => p.grupo === grupo) : productos;
    return filtrar(porGrupo, consulta);
  }, [productos, consulta, grupo]);

  // El detalle se relee del catalogo para que refleje el estado actual.
  const productoActual = useMemo(
    () =>
      seleccionado === null
        ? null
        : (productos.find((p) => p.id === seleccionado) ?? null),
    [productos, seleccionado],
  );

  const hermanos = useMemo(
    () => hermanosDe(productos, productoActual),
    [productos, productoActual],
  );

  function actualizarVentas(siguiente) {
    setVentas(siguiente);
    guardarVentas(siguiente); // se persiste en segundo plano
  }

  const vender = (producto) =>
    actualizarVentas(conVenta(ventas, producto.id, producto.qty ?? 0));

  const deshacer = (producto) => actualizarVentas(sinVenta(ventas, producto.id));

  function reiniciar() {
    setVentas({});
    borrarVentas();
  }

  // Al leer un codigo: se pone en el buscador y, si deja un unico
  // resultado, se abre su ficha directamente.
  const alLeerCodigo = useCallback(
    (texto) => {
      setEscaneando(false);
      setConsulta(texto);
      setPestana("productos");
      const coincidencias = filtrar(productos, texto);
      setSeleccionado(coincidencias.length === 1 ? coincidencias[0].id : null);
    },
    [productos],
  );

  if (cargando) {
    return (
      <div className="pantalla-centro">
        <p className="cargando">Cargando catálogo…</p>
      </div>
    );
  }

  if (fallo) {
    return (
      <div className="pantalla-centro">
        <p className="mensaje-error">{fallo}</p>
        <button
          type="button"
          className="boton-secundario"
          onClick={() => location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      {escaneando && (
        <Escaner onLeido={alLeerCodigo} onCerrar={() => setEscaneando(false)} />
      )}

      <main className="contenido">
        {productoActual ? (
          <Detalle
            producto={productoActual}
            vendidos={ventas[productoActual.id] ?? 0}
            hermanos={hermanos}
            onVender={vender}
            onDeshacer={deshacer}
            onVolver={() => setSeleccionado(null)}
            onAbrirHermano={(p) => setSeleccionado(p.id)}
            onVerGrupo={(g) => {
              setGrupo(g);
              setConsulta("");
              setSeleccionado(null);
            }}
          />
        ) : pestana === "productos" ? (
          <>
            {reiniciado && (
              <div className="aviso-version">
                <p>
                  Llegó un catálogo nuevo, así que el contador de ventas se
                  puso a cero.
                </p>
                <button type="button" onClick={() => setReiniciado(false)}>
                  Entendido
                </button>
              </div>
            )}
            <Buscador
              valor={consulta}
              onCambio={setConsulta}
              onEscanear={() => setEscaneando(true)}
            />
            {grupo && (
              <div className="filtro-grupo">
                <span>
                  Grupo <strong>{grupo}</strong>
                </span>
                <button type="button" onClick={() => setGrupo(null)}>
                  Quitar filtro ✕
                </button>
              </div>
            )}
            <Lista
              productos={filtrados}
              ventas={ventas}
              consulta={consulta}
              onAbrir={(p) => setSeleccionado(p.id)}
              onLimpiar={() => {
                setConsulta("");
                setGrupo(null);
              }}
            />
          </>
        ) : (
          <Exportar
            productos={productos}
            ventas={ventas}
            onReiniciar={reiniciar}
          />
        )}
      </main>

      {!productoActual && (
        <nav className="pestanas">
          <button
            type="button"
            className={pestana === "productos" ? "activa" : ""}
            onClick={() => setPestana("productos")}
          >
            <span aria-hidden="true">💍</span>
            Productos
          </button>
          <button
            type="button"
            className={pestana === "exportar" ? "activa" : ""}
            onClick={() => setPestana("exportar")}
          >
            <span aria-hidden="true">📊</span>
            Exportar
          </button>
        </nav>
      )}
    </div>
  );
}
