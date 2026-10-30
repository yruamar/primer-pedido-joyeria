// Carga del catalogo y busqueda.

// Vite la rellena con el `base` del config: "/" en dev, "/primer-pedido-joyeria/"
// en GitHub Pages. Prefijarla aqui deja las rutas listas para todos los consumidores
// (Tarjeta, Detalle y la exportacion a Excel), que ya no tienen que saber de la base.
const BASE = import.meta.env.BASE_URL;

/** Minusculas y sin acentos, para que "bano" encuentre "baño". */
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Lee public/productos.json y precalcula el indice de busqueda de cada producto.
 * El service worker lo tiene precacheado, asi que tambien resuelve sin conexion.
 */
export async function cargarProductos() {
  const respuesta = await fetch(`${BASE}productos.json`, { cache: "no-cache" });
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer productos.json (${respuesta.status})`);
  }
  const crudo = await respuesta.json();

  // El catalogo paso de ser un array suelto a {version, productos}. Se aceptan
  // las dos formas para que una copia vieja cacheada no deje la app en blanco.
  const version = Array.isArray(crudo) ? "" : (crudo.version ?? "");
  const lista = Array.isArray(crudo) ? crudo : (crudo.productos ?? []);

  const productos = lista.map((producto) => ({
    ...producto,
    // El JSON guarda "imagenes/12.jpg"; la app necesita la ruta ya absoluta.
    imagen: producto.imagen ? BASE + producto.imagen : null,
    // Solo se busca por codigos, nunca por el nombre del producto.
    indiceBusqueda: normalizar(
      [
        producto.codigo,
        producto.grupo,
        producto.sku,
        producto.skuCompleto,
        producto.barras, // catalogos viejos
      ]
        .filter(Boolean)
        .join(" "),
    ),
  }));

  return { version, productos };
}

/** Productos del mismo grupo, excluyendo el que se esta viendo. */
export function hermanosDe(productos, producto) {
  if (!producto?.grupo) return [];
  return productos.filter(
    (p) => p.grupo === producto.grupo && p.id !== producto.id,
  );
}

/** Lista de grupos con su recuento, de mayor a menor. */
export function gruposDe(productos) {
  const cuenta = new Map();
  for (const p of productos) {
    if (p.grupo) cuenta.set(p.grupo, (cuenta.get(p.grupo) ?? 0) + 1);
  }
  return [...cuenta.entries()]
    .map(([grupo, total]) => ({ grupo, total }))
    .sort((a, b) => b.total - a.total || a.grupo.localeCompare(b.grupo));
}

/**
 * Filtro por "contiene", sin distinguir mayusculas ni acentos.
 * Buscar "23" devuelve tambien "55462358498".
 */
export function filtrar(productos, consulta) {
  const texto = normalizar(consulta);
  if (!texto) return productos;
  return productos.filter((producto) =>
    producto.indiceBusqueda.includes(texto),
  );
}

/** Disponible = lo pedido menos lo vendido, nunca por debajo de 0. */
export function disponibleDe(producto, vendidos) {
  return Math.max(0, (producto.qty ?? 0) - (vendidos ?? 0));
}

/** Formatea el precio para mostrarlo; el JSON trae numeros sueltos. */
export function formatearPrecio(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  const numero = Number(valor);
  if (Number.isNaN(numero)) return String(valor);
  return numero.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });
}
