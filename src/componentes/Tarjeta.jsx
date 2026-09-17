import { disponibleDe, formatearPrecio } from "../datos.js";

export default function Tarjeta({ producto, vendidos, onAbrir }) {
  const disponible = disponibleDe(producto, vendidos);
  const agotado = disponible === 0;

  return (
    <button type="button" className="tarjeta" onClick={() => onAbrir(producto)}>
      <div className="tarjeta-foto">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} loading="lazy" />
        ) : (
          <span className="sin-foto" aria-hidden="true">
            💍
          </span>
        )}
      </div>

      <div className="tarjeta-datos">
        <div className="tarjeta-linea1">
          <span className="tarjeta-sku">{producto.sku}</span>
          <span className="tarjeta-precio">
            {formatearPrecio(producto.precio)}
          </span>
        </div>

        <p className="tarjeta-nombre">{producto.nombre}</p>

        <div className="tarjeta-etiquetas">
          <span className="etiqueta">{producto.tipo}</span>
          <span className="etiqueta">{producto.material}</span>
        </div>

        <div className={`tarjeta-stock ${agotado ? "agotado" : ""}`}>
          {agotado ? (
            "Agotado"
          ) : (
            <>
              Disponible: <strong>{disponible}</strong>
              <span className="de-total"> de {producto.qty}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
