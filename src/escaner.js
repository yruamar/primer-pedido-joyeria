// Arranque del lector de codigos de barras.
//
// zxing-wasm descarga su binario desde el CDN de jsDelivr por defecto. Eso
// romperia el requisito de funcionar sin conexion, asi que aqui se redirige al
// .wasm que Vite emite como asset local (y que el service worker precachea).

import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";

prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) =>
      path.endsWith(".wasm") ? wasmUrl : prefix + path,
  },
});

/** Formatos de tienda: Code128 y la familia EAN/UPC, mas algunos habituales. */
export const FORMATOS = [
  "Code128",
  "EAN13",
  "EAN8",
  "UPCA",
  "UPCE",
  "ITF",
  "Code39",
  "Code93",
  "Codabar",
];

/** Descodifica un frame ya pintado en un canvas. Devuelve el texto o null. */
export async function leerFrame(imageData) {
  const resultados = await readBarcodes(imageData, {
    formats: FORMATOS,
    tryHarder: true,
    tryRotate: true,
    tryInvert: true,
    maxNumberOfSymbols: 1,
  });
  const valido = resultados.find((r) => r.isValid !== false && r.text);
  return valido ? valido.text.trim() : null;
}

/** Precarga el wasm para que el primer escaneo no se quede colgado. */
export function precalentar() {
  prepareZXingModule({ fireImmediately: true })?.catch?.(() => {});
}
