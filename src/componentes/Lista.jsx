import Tarjeta from "./Tarjeta.jsx";

export default function Lista({ productos, ventas, consulta, onAbrir, onLimpiar }) {
  if (productos.length === 0) {
    return (
      <div className="vacio">
        <p className="vacio-icono" aria-hidden="true">
          🔎
        </p>
        <p className="vacio-texto">
          Ningún producto coincide con <strong>«{consulta}»</strong>.
        </p>
        <button type="button" className="boton-secundario" onClick={onLimpiar}>
          Ver todos
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="contador">
        {productos.length} {productos.length === 1 ? "producto" : "productos"}
      </p>
      <div className="lista">
        {productos.map((producto) => (
          <Tarjeta
            key={producto.id}
            producto={producto}
            vendidos={ventas[producto.id] ?? 0}
            onAbrir={onAbrir}
          />
        ))}
      </div>
    </>
  );
}
