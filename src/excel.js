// Exportacion a .xlsx con ExcelJS, reproduciendo las columnas del archivo
// original (A-S) y anadiendo Vendidos y Disponible.
//
// Se importa el bundle de navegador explicitamente: el "main" de exceljs es el
// build de Node y depende de modulos que no existen aqui.
import ExcelJS from "exceljs/dist/exceljs.min.js";

import { disponibleDe } from "./datos.js";

// Orden exacto de la hoja "Pedido" original.
const COLUMNAS = [
  { titulo: "Order No.", ancho: 20, valor: (p) => p.orderNo },
  { titulo: "Tipo de objeto", ancho: 14, valor: (p) => p.tipo },
  { titulo: "Material base", ancho: 18, valor: (p) => p.material },
  { titulo: "Acabado / baño", ancho: 18, valor: (p) => p.acabado },
  { titulo: "Piedras / detalles", ancho: 22, valor: (p) => p.piedras },
  { titulo: "¿Tiene piedras?", ancho: 14, valor: (p) => p.tienePiedras },
  { titulo: "Sku", ancho: 45, valor: (p) => p.skuCompleto },
  { titulo: "Product Image", ancho: 15, valor: () => null }, // H: la foto
  { titulo: "Qty", ancho: 8, valor: (p) => p.qty },
  { titulo: "Price", ancho: 12, valor: (p) => p.extra?.price },
  { titulo: "Price with discount", ancho: 16, valor: (p) => p.extra?.priceConDescuento },
  { titulo: "Total with discount", ancho: 16, valor: (p) => p.extra?.totalConDescuento },
  { titulo: "Shipped Qty", ancho: 12, valor: (p) => p.extra?.shippedQty },
  { titulo: "Shipped amount", ancho: 14, valor: (p) => p.extra?.shippedAmount },
  { titulo: "Out of Stock", ancho: 12, valor: (p) => p.extra?.outOfStock },
  { titulo: "Product Name", ancho: 50, valor: (p) => p.nombre },
  { titulo: "Precio", ancho: 10, valor: (p) => p.precio },
  { titulo: "SKU", ancho: 16, valor: (p) => p.sku },
  { titulo: "COdigo barras", ancho: 20, valor: (p) => p.barras },
  // Columnas nuevas
  { titulo: "Vendidos", ancho: 11, valor: (p, vendidos) => vendidos },
  { titulo: "Disponible", ancho: 11, valor: (p, vendidos) => disponibleDe(p, vendidos) },
];

const COLUMNA_IMAGEN = 7; // indice 0-based de la columna H en ExcelJS
const ALTO_FILA = 78; // puntos
const LADO_IMAGEN = 96; // px dentro de la celda

function nombreArchivo() {
  const hoy = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `inventario-${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(
    hoy.getDate(),
  )}.xlsx`;
}

/**
 * Genera el .xlsx y lo descarga.
 * @param {Array} productos catalogo completo
 * @param {Object} ventas   mapa { id: vendidos }
 * @param {Function} onProgreso recibe (hechos, total)
 */
export async function exportarXlsx(productos, ventas, onProgreso = () => {}) {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Inventario Joyeria";
  libro.created = new Date();
  const hoja = libro.addWorksheet("Pedido");

  hoja.columns = COLUMNAS.map((c) => ({ width: c.ancho }));

  const encabezado = hoja.addRow(COLUMNAS.map((c) => c.titulo));
  encabezado.font = { bold: true };
  encabezado.alignment = { vertical: "middle", wrapText: true };
  encabezado.height = 30;
  hoja.views = [{ state: "frozen", ySplit: 1 }];

  const total = productos.length;
  let hechos = 0;

  for (const producto of productos) {
    const vendidos = ventas[producto.id] ?? 0;
    const fila = hoja.addRow(COLUMNAS.map((c) => c.valor(producto, vendidos)));
    fila.height = ALTO_FILA;
    fila.alignment = { vertical: "middle", wrapText: true };

    if (producto.imagen) {
      try {
        // Sale del precache del service worker, asi que tambien va sin conexion.
        const respuesta = await fetch(producto.imagen);
        if (respuesta.ok) {
          const buffer = await respuesta.arrayBuffer();
          const idImagen = libro.addImage({ buffer, extension: "jpeg" });
          hoja.addImage(idImagen, {
            tl: { col: COLUMNA_IMAGEN + 0.1, row: fila.number - 1 + 0.1 },
            ext: { width: LADO_IMAGEN, height: LADO_IMAGEN },
            editAs: "oneCell",
          });
        }
      } catch (error) {
        // Una foto que falle no debe tumbar el export entero.
        console.warn(`No se pudo incrustar ${producto.imagen}:`, error);
      }
    }

    hechos += 1;
    if (hechos % 5 === 0 || hechos === total) onProgreso(hechos, total);
  }

  const datos = await libro.xlsx.writeBuffer();
  const blob = new Blob([datos], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo();
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  // Safari necesita un respiro antes de liberar el objeto.
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return enlace.download;
}
