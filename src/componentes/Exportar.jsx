import { useState } from "react";
import { exportarXlsx } from "../excel.js";
import { borrarTodo, hayConexion } from "../limpieza.js";
import { totalVendido } from "../ventas.js";

export default function Exportar({ productos, ventas, onReiniciar }) {
  const [estado, setEstado] = useState("listo"); // listo | generando | hecho | error
  const [progreso, setProgreso] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [borrando, setBorrando] = useState(false);

  const vendidas = totalVendido(ventas);
  const conVentas = Object.keys(ventas).length;

  async function descargar() {
    setEstado("generando");
    setProgreso(0);
    setMensaje("");
    try {
      const nombre = await exportarXlsx(productos, ventas, (hechos, total) =>
        setProgreso(Math.round((hechos / total) * 100)),
      );
      setEstado("hecho");
      setMensaje(`Descargado: ${nombre}`);
    } catch (error) {
      console.error(error);
      setEstado("error");
      setMensaje(`No se pudo generar el archivo: ${error.message}`);
    }
  }

  function reiniciar() {
    const confirmado = window.confirm(
      `Se borrarán ${vendidas} ${vendidas === 1 ? "venta" : "ventas"} ` +
        `de ${conVentas} ${conVentas === 1 ? "producto" : "productos"}.\n\n` +
        "Esta acción no se puede deshacer. ¿Continuar?",
    );
    if (confirmado) onReiniciar();
  }

  async function empezarDeCero() {
    // Sin conexion el borrado deja la app sin nada que cargar: se avisa antes.
    if (!hayConexion()) {
      const sigue = window.confirm(
        "NO HAY CONEXIÓN A INTERNET.\n\n" +
          "Al borrarlo todo se elimina también la copia que permite usar la " +
          "app sin señal, y hará falta internet para volver a descargarla. " +
          "Si continúas ahora, la app podría quedarse en blanco hasta que " +
          "tengas conexión.\n\n¿Continuar de todas formas?",
      );
      if (!sigue) return;
    }

    const confirmado = window.confirm(
      "BORRAR TODO Y EMPEZAR DE CERO\n\n" +
        "Se eliminará del teléfono:\n" +
        `  • ${vendidas} ${vendidas === 1 ? "venta registrada" : "ventas registradas"}\n` +
        "  • La copia descargada del catálogo y las fotos\n\n" +
        "Después la app se vuelve a descargar desde cero. El catálogo no se " +
        "pierde: se baja otra vez.\n\n" +
        "Esto NO se puede deshacer. ¿Continuar?",
    );
    if (!confirmado) return;

    // Segunda confirmacion solo si hay ventas que se perderian sin guardar.
    if (vendidas > 0) {
      const seguro = window.confirm(
        `Vas a perder ${vendidas} ${vendidas === 1 ? "venta" : "ventas"} sin ` +
          "exportar.\n\nSi aún no has descargado el .xlsx, cancela y hazlo " +
          "primero.\n\n¿Borrar de todas formas?",
      );
      if (!seguro) return;
    }

    setBorrando(true);
    try {
      await borrarTodo();
    } finally {
      // Recarga limpia: ya no hay service worker ni cache que sirvan nada viejo.
      window.location.reload();
    }
  }

  return (
    <div className="exportar">
      <h2>Exportar</h2>

      <div className="panel">
        <div className="panel-cifras">
          <div>
            <span className="cifra">{productos.length}</span>
            <span className="cifra-etiqueta">productos</span>
          </div>
          <div>
            <span className="cifra">{vendidas}</span>
            <span className="cifra-etiqueta">
              {vendidas === 1 ? "unidad vendida" : "unidades vendidas"}
            </span>
          </div>
        </div>

        <p className="panel-texto">
          Genera un Excel con todas las columnas del pedido original, la foto de
          cada producto en su celda, y dos columnas nuevas:{" "}
          <strong>Vendidos</strong> y <strong>Disponible</strong>.
        </p>

        <button
          type="button"
          className="boton-grande exportar-boton"
          onClick={descargar}
          disabled={estado === "generando"}
        >
          {estado === "generando"
            ? `Generando… ${progreso}%`
            : "Descargar .xlsx"}
        </button>

        {estado === "generando" && (
          <div className="barra">
            <div className="barra-relleno" style={{ width: `${progreso}%` }} />
          </div>
        )}
        {estado === "hecho" && <p className="mensaje-ok">{mensaje}</p>}
        {estado === "error" && <p className="mensaje-error">{mensaje}</p>}
      </div>

      <div className="panel peligro">
        <h3>Reiniciar ventas</h3>
        <p className="panel-texto">
          Pone a cero el contador de todos los productos. El catálogo no se toca.
        </p>
        <button
          type="button"
          className="boton-grande reiniciar"
          onClick={reiniciar}
          disabled={vendidas === 0}
        >
          {vendidas === 0 ? "No hay ventas registradas" : "Reiniciar ventas"}
        </button>

        <hr className="separador" />

        <h3>Empezar de cero</h3>
        <p className="panel-texto">
          Borra del teléfono <strong>todo</strong> lo que guarda la app: las
          ventas y la copia descargada del catálogo y las fotos. Después se
          vuelve a descargar limpia, sin rastro de lo anterior.
        </p>
        <p className="panel-nota">
          Necesitas internet para que la app se descargue de nuevo.
        </p>
        <button
          type="button"
          className="boton-grande reiniciar"
          onClick={empezarDeCero}
          disabled={borrando}
        >
          {borrando ? "Borrando…" : "Borrar todo y empezar de cero"}
        </button>
      </div>
    </div>
  );
}
