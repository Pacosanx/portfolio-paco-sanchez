# Portfolio de Paco Sanchez

Portfolio personal de diseño digital, experimentación con tecnología e interactividad. El sitio está hecho con HTML, CSS y JavaScript sin dependencias de instalación; `content.json`, `teaching.json` y `parallel.mjs` contienen el contenido que compone las páginas.

## Requisitos

- Node.js 22 o superior.
- Git para clonar y versionar el proyecto.

## Desarrollo local

Desde la carpeta raíz del repositorio, generá las páginas y revisá el sitio en `http://localhost:4173`:

```sh
node compose.mjs
node serve.mjs
```

El servidor local queda activo en esa terminal. Abrí la dirección indicada y detenelo con `Ctrl+C`.

## Validación

```sh
node compose.mjs
node verify.mjs
```

La verificación comprueba las páginas de proyectos, sus enlaces internos y las imágenes referenciadas. GitHub Actions ejecuta estos pasos en cada push y pull request.

## Estructura

- `content.json`, `teaching.json`, `parallel.mjs` y `filters.mjs`: contenido y datos del portfolio.
- `compose.mjs`: genera la página principal y las páginas de cada proyecto en `dist/`.
- `dist/`: sitio estático generado, listo para servir desde un hosting estático.
- `verify.mjs`: comprobaciones estructurales del sitio.
- `.openai/hosting.json`: configuración de publicación del proyecto existente en Codex Sites.

La publicación principal es [GitHub Pages](https://pacosanx.github.io/portfolio-paco-sanchez/). El workflow configura `SITE_BASE_PATH=/portfolio-paco-sanchez` y `SITE_ORIGIN=https://pacosanx.github.io`; el generador y la verificación admiten también la raíz local.

## Presentaciones de proyectos

`content.json` es la fuente de las fichas y del panel de lectura. Las descripciones introducen el proyecto; los bloques `text` usan `heading` para organizar el recorrido sin repetir la introducción. La tipografía de las piezas se conserva como obra; las placas explicativas se escriben como HTML.

Los bloques `gallery` admiten `columns` de 1 a 4. Las vistas principales se muestran amplias y los detalles se agrupan; todas las imágenes se pueden ampliar. `surface` define un fondo compartido y `seamless: true` elimina separaciones. Los medios consecutivos con el mismo fondo forman una banda continua. El lector responde a su propio ancho, tanto en página completa como dentro del panel.

`assets/fachada`, `assets/presentation` y `assets/previews` contienen medios locales y se copian a `dist/assets` al generar. Las previews del índice se definen en `preview-selection.json`. Los archivos de revisión y las copias previas se conservan fuera de la publicación en `.qa/`.
