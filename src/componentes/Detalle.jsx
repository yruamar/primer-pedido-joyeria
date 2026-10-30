import { disponibleDe, formatearPrecio } from "../datos.js";

function Campo({ etiqueta, valor }) {
  const vacio = valor === null || valor === undefined || valor === "";
  return (
    <div className="campo">
      <dt>{etiqueta}</dt>
      <dd className={vacio ? "campo-vacio" : ""}>{vacio ? "—" : String(valor)}</dd>
    </div>
  );
}

export default function Detalle({
  producto,
  vendidos,
  hermanos = [],
  onVender,
  onDeshacer,
  onVolver,
  onAbrirHermano,
  onVerGrupo,
}) {
  const disponible = disponibleDe(producto, vendidos);
  const extra = producto.extra ?? {};

  return (
    <div className="detalle">
      <button type="button" className="volver" onClick={onVolver}>
        ← Volver
      </button>

      <div className="detalle-foto">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} />
        ) : (
          <span className="sin-foto grande" aria-hidden="true">
            💍
          </span>
        )}
      </div>

      <h2 className="detalle-nombre">{producto.nombre}</h2>

      <div className="detalle-resumen">
        <div className="resumen-precio">{formatearPrecio(producto.precio)}</div>
        <div className={`resumen-stock ${disponible === 0 ? "agotado" : ""}`}>
          <span className="resumen-numero">{disponible}</span>
          <span className="resumen-etiqueta">disponibles de {producto.qty}</span>
        </div>
      </div>

      {vendidos > 0 && (
        <p className="aviso-vendidos">
          Llevas <strong>{vendidos}</strong>{" "}
          {vendidos === 1 ? "unidad vendida" : "unidades vendidas"}.
        </p>
      )}

      {hermanos.length > 0 && (
        <section className="hermanos">
          <div className="hermanos-cabecera">
            <h3>
              Otras {hermanos.length} de <strong>{producto.grupo}</strong>
            </h3>
            <button type="button" onClick={() => onVerGrupo(producto.grupo)}>
              Ver todas
            </button>
          </div>
          <div className="hermanos-tira">
            {hermanos.map((h) => (
              <button
                key={h.id}
                type="button"
                className="hermano"
                onClick={() => onAbrirHermano(h)}
                title={h.nombre}
              >
                {h.imagen ? (
                  <img src={h.imagen} alt={h.nombre} loading="lazy" />
                ) : (
                  <span className="sin-foto" aria-hidden="true">
                    💍
                  </span>
                )}
                <span className="hermano-codigo">{h.codigo || h.sku}</span>
                <span className="hermano-precio">
                  {formatearPrecio(h.precio)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <dl className="campos">
        <Campo etiqueta="ID (fila)" valor={producto.id} />
        <Campo etiqueta="Código" valor={producto.codigo} />
        <Campo etiqueta="Grupo" valor={producto.grupo} />
        <Campo etiqueta="SKU proveedor" valor={producto.sku} />
        <Campo etiqueta="Sku completo" valor={producto.skuCompleto} />
        <Campo etiqueta="Order No." valor={producto.orderNo} />
        <Campo etiqueta="Tipo de objeto" valor={producto.tipo} />
        <Campo etiqueta="Material base" valor={producto.material} />
        <Campo etiqueta="Acabado / baño" valor={producto.acabado} />
        <Campo etiqueta="Piedras / detalles" valor={producto.piedras} />
        <Campo etiqueta="¿Tiene piedras?" valor={producto.tienePiedras} />
        <Campo etiqueta="Cantidad pedida" valor={producto.qty} />
        <Campo etiqueta="Precio" valor={formatearPrecio(producto.precio)} />
        {/* Price, Price with discount, Total with discount y Shipped amount no se
            muestran: son columnas en crudo del Excel que no hacen falta en tienda.
            Siguen viajando en producto.extra, asi que la exportacion las conserva. */}
        <Campo etiqueta="Shipped Qty" valor={extra.shippedQty} />
        <Campo etiqueta="Out of Stock" valor={extra.outOfStock} />
        <Campo etiqueta="Imagen" valor={producto.imagen} />
      </dl>

      <div className="acciones">
        <button
          type="button"
          className="boton-grande vender"
          onClick={() => onVender(producto)}
          disabled={disponible === 0}
        >
          {disponible === 0 ? "Sin existencias" : "Vender 1"}
        </button>
        <button
          type="button"
          className="boton-grande deshacer"
          onClick={() => onDeshacer(producto)}
          disabled={vendidos === 0}
        >
          Deshacer
        </button>
      </div>
    </div>
  );
}
