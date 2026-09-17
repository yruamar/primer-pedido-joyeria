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
  const productos = await respuesta.json();

  return productos.map((producto) => ({
    ...producto,
    // El JSON guarda "imagenes/12.jpg"; la app necesita la ruta ya absoluta.
    imagen: producto.imagen ? BASE + producto.imagen : null,
    // Solo se busca por codigos, no por nombre.
    indiceBusqueda: normalizar(
      [producto.sku, producto.skuCompleto, producto.barras].join(" "),
    ),
  }));
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
