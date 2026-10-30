// Persistencia de las ventas en IndexedDB.
// Una sola clave con el mapa { idProducto: cantidadVendida }.

import { get, set, del } from "idb-keyval";

const CLAVE = "ventas";
const CLAVE_VERSION = "catalogoVersion";

export async function cargarVentas() {
  try {
    return (await get(CLAVE)) ?? {};
  } catch (error) {
    // Modo privado o almacenamiento bloqueado: la app sigue funcionando,
    // solo que las ventas no sobreviven al cierre.
    console.warn("No se pudieron leer las ventas guardadas:", error);
    return {};
  }
}

export async function guardarVentas(ventas) {
  try {
    await set(CLAVE, ventas);
  } catch (error) {
    console.warn("No se pudieron guardar las ventas:", error);
  }
}

export async function borrarVentas() {
  try {
    await del(CLAVE);
  } catch (error) {
    console.warn("No se pudieron borrar las ventas:", error);
  }
}

/** Suma una venta sin pasar del total pedido. */
export function conVenta(ventas, id, qty) {
  const actual = ventas[id] ?? 0;
  if (actual >= qty) return ventas;
  return { ...ventas, [id]: actual + 1 };
}

/** Deshace una venta de ese producto; nunca baja de 0. */
export function sinVenta(ventas, id) {
  const actual = ventas[id] ?? 0;
  if (actual <= 0) return ventas;
  const siguiente = { ...ventas, [id]: actual - 1 };
  if (siguiente[id] === 0) delete siguiente[id];
  return siguiente;
}

export function totalVendido(ventas) {
  return Object.values(ventas).reduce((suma, n) => suma + n, 0);
}

/**
 * Los id de producto son numeros de fila del Excel: al cambiar de pedido, el
 * id 2 pasa a designar otro articulo. Si se arrastraran las ventas guardadas
 * se le atribuirian al producto equivocado, y en silencio. Por eso, cuando
 * llega un catalogo nuevo, el contador se pone a cero.
 *
 * Devuelve true si hubo que reiniciar.
 */
let ultimaSync = { version: null, reinicio: false };

export async function sincronizarVersion(version) {
  if (!version) return false; // catalogo sin version: no se toca nada

  // El resultado se recuerda por version. Sin esto, una segunda llamada (el
  // StrictMode de desarrollo monta el efecto dos veces) ya encontraria la
  // version nueva guardada, respondería "no hubo reinicio" y el aviso al
  // usuario se perderia aunque las ventas si se hubieran borrado.
  if (ultimaSync.version === version) return ultimaSync.reinicio;

  try {
    const guardada = await get(CLAVE_VERSION);
    if (guardada === version) {
      ultimaSync = { version, reinicio: false };
      return false;
    }

    const habiaVentas = Object.keys((await get(CLAVE)) ?? {}).length > 0;
    await del(CLAVE);
    await set(CLAVE_VERSION, version);
    // La primera vez no hay version guardada; solo se avisa si se perdio algo.
    const reinicio = guardada !== undefined && habiaVentas;
    ultimaSync = { version, reinicio };
    return reinicio;
  } catch (error) {
    console.warn("No se pudo comprobar la version del catalogo:", error);
    return false;
  }
}
