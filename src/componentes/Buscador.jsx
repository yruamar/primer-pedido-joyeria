export default function Buscador({ valor, onCambio, onEscanear }) {
  return (
    <div className="buscador">
      <div className="buscador-campo">
        <span className="buscador-icono" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          className="buscador-input"
          placeholder="SKU o código"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          inputMode="search"
          aria-label="Buscar por SKU o código de barras"
        />
        {valor && (
          <button
            type="button"
            className="buscador-limpiar"
            onClick={() => onCambio("")}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>
      <button type="button" className="boton-escanear" onClick={onEscanear}>
        <span aria-hidden="true">📷</span> Escanear
      </button>
    </div>
  );
}
