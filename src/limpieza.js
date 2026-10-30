// Borrado completo: deja la app como recien instalada.
//
// Va mas alla de "Reiniciar ventas": ademas del contador, tira la copia
// offline y el service worker. Por eso hace falta conexion despues, o la app
// se queda sin nada que cargar.

import { clear } from "idb-keyval";

/**
 * Borra todo lo que la app guarda en el dispositivo y devuelve un recuento
 * de lo que se elimino, para poder informar al usuario.
 *
 * Cada paso va en su propio try: si el navegador bloquea uno (modo privado,
 * datos del sitio restringidos) los demas deben completarse igual.
 */
export async function borrarTodo() {
  const hecho = { datos: false, caches: 0, serviceWorkers: 0, navegador: false };

  // 1. Ventas y version del catalogo (IndexedDB).
  try {
    await clear();
    hecho.datos = true;
  } catch (error) {
    console.warn("No se pudieron borrar los datos guardados:", error);
  }

  // 2. Copia offline: el precache del service worker.
  try {
    const nombres = await caches.keys();
    await Promise.all(nombres.map((n) => caches.delete(n)));
    hecho.caches = nombres.length;
  } catch (error) {
    console.warn("No se pudo borrar la copia offline:", error);
  }

  // 3. El propio service worker, para que la proxima carga sea limpia.
  try {
    const registros = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registros.map((r) => r.unregister()));
    hecho.serviceWorkers = registros.length;
  } catch (error) {
    console.warn("No se pudo desregistrar el service worker:", error);
  }

  // 4. Lo que pudiera haber quedado en el almacenamiento del navegador.
  try {
    localStorage.clear();
    sessionStorage.clear();
    hecho.navegador = true;
  } catch (error) {
    console.warn("No se pudo limpiar el almacenamiento:", error);
  }

  return hecho;
}

/** Hay conexion? Tras el borrado la app necesita descargarse de nuevo. */
export function hayConexion() {
  return navigator.onLine !== false;
}
