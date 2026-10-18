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

Espora define su secuencia en `presentation`, dentro de `development-projects.json`, usando los mismos bloques del lector de proyectos. `dist/espora.css` alterna escalas y mantiene el video completo entre ambos márgenes. Los tres GIFs de `assets/development/espora/interacciones` son fragmentos del recorrido original (jardín: 8,5–14,5 s; nodos: 139–146 s; visor: 640–646 s) y tienen una imagen estática para la preferencia de movimiento reducido. El reporte se presenta únicamente como una captura secundaria.

## Presentaciones de proyectos

`dist/layout-system.css` centraliza la grilla, la escala de espaciado y las reglas tipográficas compartidas. Las secciones se separan 96 px en escritorio y 64 px en pantallas menores; las fichas adaptan sus columnas al ancho de su contenedor, incluido el panel lateral.

El índice presenta áreas y búsqueda en la columna izquierda, con opciones de texto y selección subrayada. En pantallas de hasta 800 px, los controles pasan encima del listado. Área y búsqueda se combinan y se pueden restablecer juntas.

`content.json` es la fuente de las fichas y del panel de lectura. Las descripciones introducen el proyecto; los bloques `text` usan `heading` para organizar el recorrido sin repetir la introducción. La tipografía de las piezas se conserva como obra; las placas explicativas se escriben como HTML.

Los bloques `gallery` admiten `columns` de 1 a 4. Las vistas principales se muestran amplias y los detalles se agrupan; todas las imágenes se pueden ampliar. `surface` define un fondo compartido y `seamless: true` elimina separaciones. Los medios consecutivos con el mismo fondo forman una banda continua. El lector responde a su propio ancho, tanto en página completa como dentro del panel.

`assets/fachada`, `assets/presentation` y `assets/previews` contienen medios locales y se copian a `dist/assets` al generar. Las previews del índice se definen en `preview-selection.json`. Los archivos de revisión y las copias previas se conservan fuera de la publicación en `.qa/`.

`theme` permite adaptar el fondo y los colores de lectura de una ficha completa, incluido el visor. Esquemática combina una vista `overview` de la pieza entera con una vista `bleed` que llega a los bordes; sus variantes `srcset` conservan la legibilidad sin cargar siempre el original completo. La secuencia editorial de Maradona Alien usa `layout: "original-sequence"` para respetar el orden y las composiciones del proyecto original.

Cada vista previa reúne tres imágenes: una pieza completa (`role: "whole"`) y dos vistas complementarias. `crop` y `clipPath` excluyen los fondos exteriores sin modificar la obra original. La composición acompaña la altura del título activo y se mantiene dentro de la ventana.

Las composiciones del índice alternan posiciones y escalas según el proyecto. Los recortes de presentación de Fachada e INMSON usan viewports SVG sobre los originales; el mapa de Fachada reúne veinte pantallas numeradas. Vaivén conserva su pase de ocho páginas con los originales sobre transparencia, sin el tramado del GIF anterior, y respeta la preferencia de movimiento reducido.

Los bloques `placeholder` reservan piezas pendientes con un rectángulo rojo grande y un título accesible. No cuentan como imágenes ni simulan una interacción disponible.

INMSON presenta una vista general, dos loops complementarios en dos columnas (dibujar en primera persona y atravesar los trazos) y una franja pequeña de registros de uso. Los medios de `assets/inmson/` provienen de las capturas de Unity realizadas el 15 de octubre de 2026: `04-primera-persona.mp4` (25–30 s), `05-atravesar-dibujo.mp4` (4–9 s), `vista-previa.jpg`. Los loops están optimizados a 560 × 315 y 8 fps; cada uno tiene una captura estática para movimiento reducido. Son demostraciones automatizadas de la escena original, conservada sin cambios.

La interacción de INMSON se presenta sin introducción ni epígrafe exterior. La foto y los videos `20231003_123236.mp4` y `VID_20231010_125503357.mp4`, aportados por Paco, documentan el uso con visor y la versión táctil en tablet. Se publican en `assets/inmson/` a 960 px de ancho; los videos completos se convierten a H.264/AAC con reproducción manual y audio original.
