import { useState } from "react";
import { exportarXlsx } from "../excel.js";
import { totalVendido } from "../ventas.js";

export default function Exportar({ productos, ventas, onReiniciar }) {
  const [estado, setEstado] = useState("listo"); // listo | generando | hecho | error
  const [progreso, setProgreso] = useState(0);
  const [mensaje, setMensaje] = useState("");

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
      </div>
    </div>
  );
}
