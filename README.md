# Inventario Joyería — PWA offline

### 👉 **https://yruamar.github.io/primer-pedido-joyeria/**

Catálogo de bolsillo para usar en la tienda desde el móvil, **sin conexión**.
Busca productos por código (tecleado o escaneado), registra ventas que sobreviven
al cierre de la app, y exporta un `.xlsx` con el estado del inventario.

## Instalarla en el móvil

Abre el enlace de arriba en el teléfono y añádela a la pantalla de inicio:

- **Android (Chrome)**: menú ⋮ → *Instalar aplicación* / *Añadir a pantalla de inicio*.
- **iPhone (Safari)**: botón Compartir → *Añadir a pantalla de inicio*.

A partir de ahí se abre como una app normal, a pantalla completa. Déjala cargar
una vez con internet: descarga el catálogo, las fotos y el lector de códigos, y
después **funciona entera en modo avión**. La cámara pide permiso la primera vez
que abres el escáner.

## Puesta en marcha (desarrollo)

```bash
npm install
python convertir.py     # genera public/productos.json y public/imagenes/
npm run dev             # https://localhost:5173/primer-pedido-joyeria/
```

> El servidor de desarrollo también sirve bajo `/primer-pedido-joyeria/`, porque es
> la ruta en la que GitHub Pages publica el sitio (`base` en `vite.config.js`).

El navegador avisará de que el certificado no es de confianza (es autofirmado,
lo genera `@vitejs/plugin-basic-ssl`). Acéptalo: **la cámara solo funciona en
HTTPS o localhost**, por eso el servidor va en https.

### Usarlo desde el móvil

```bash
npm run dev -- --host
```

Abre `https://<ip-de-tu-pc>:5173/primer-pedido-joyeria/` en el teléfono, acepta el
aviso de certificado y da permiso de cámara. Para el uso normal no hace falta: usa
la URL pública de arriba, que va por HTTPS real y sin avisos.

### Producción

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ para comprobarlo
```

## Despliegue

`.github/workflows/deploy.yml` compila y publica en GitHub Pages **en cada push a
`main`**. No hay que subir `dist/` a mano: está en `.gitignore`.

Configuración en GitHub (una sola vez): *Settings → Pages → Source: **GitHub Actions***.

## Cómo se actualizan los datos

`convertir.py` lee `pedido-filtrable2.xlsx` y escribe directamente en `public/`,
que es la carpeta estática de Vite:

```bash
python convertir.py     # o: npm run datos
git add public && git commit -m "actualiza catalogo" && git push
```

El push dispara el despliegue y la app queda actualizada sola.

> **Ojo**: `convertir.py` y `pedido-filtrable2.xlsx` **no están en el repositorio**
> (ver `.gitignore`), porque el repo es público. Viven solo en la PC de trabajo. Lo
> que sí se versiona es su resultado: `public/productos.json` y `public/imagenes/`.
> Guarda una copia de esos dos archivos fuera del repo.

## Funcionamiento sin conexión

El service worker precachea **las 78 piezas** que necesita la app: el HTML, el JS,
el CSS, `productos.json`, las 67 fotos, los iconos y el binario WASM del lector de
códigos. Una vez abierta la primera vez, funciona entera en modo avión, incluida
la exportación a Excel.

No hay ninguna llamada a CDNs. `zxing-wasm` intenta por defecto bajar su `.wasm`
de jsDelivr; `src/escaner.js` lo redirige al binario local con `prepareZXingModule`
+ `locateFile`. Si algún día se cambia esa parte, hay que mantener esa redirección
o el escáner dejará de funcionar sin internet.

## Estructura

```
convertir.py           Excel -> productos.json + imagenes/   (fuera del repo)
public/                carpeta estatica de Vite (la genera convertir.py)
.github/workflows/     despliegue automatico a GitHub Pages
src/
  datos.js             carga del catalogo y filtro de busqueda
  ventas.js            persistencia en IndexedDB (idb-keyval)
  escaner.js           arranque de zxing-wasm apuntando al wasm local
  excel.js             exportacion con ExcelJS (fotos incrustadas)
  componentes/         Buscador, Lista, Tarjeta, Detalle, Escaner, Exportar
```

## Detalles de comportamiento

- **Búsqueda**: por *contiene*, sin distinguir mayúsculas ni acentos, sobre `sku`,
  `skuCompleto` y `barras`. Teclear `23` encuentra también `55462358498`.
- **Escáner**: lee Code128, EAN-13/8, UPC-A/E, ITF, Code39, Code93 y Codabar.
  El código leído se pone en el buscador; si deja un único resultado, abre su ficha.
- **Ventas**: `Vender 1` y `Deshacer` actúan sobre el producto abierto. Disponible
  nunca baja de 0, y `Vender 1` se deshabilita al llegar a 0.
- **Export**: reproduce las 19 columnas originales (A–S) con la foto en la columna
  `Product Image`, y añade `Vendidos` y `Disponible`.
- `Reiniciar ventas` pide confirmación y solo borra el contador, nunca el catálogo.
