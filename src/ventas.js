// Persistencia de las ventas en IndexedDB.
// Una sola clave con el mapa { idProducto: cantidadVendida }.

import { get, set, del } from "idb-keyval";

const CLAVE = "ventas";

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
