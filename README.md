# Portfolio de Paco Sanchez

Portfolio personal de diseño digital, experimentación con tecnología e interactividad. El sitio está hecho con HTML, CSS y JavaScript sin dependencias de instalación; `content.json`, `teaching.json` y `parallel.mjs` contienen el contenido que compone las páginas.

## Requisitos

- Node.js 22 o superior.
- Git para clonar y versionar el proyecto.

## Desarrollo local

Desde la carpeta raíz del repositorio, generá las páginas y revisá el sitio en `http://127.0.0.1:4173`:

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

Las imágenes se conservan en las direcciones que forman parte del contenido de cada proyecto. La URL canónica del sitio generado apunta a la publicación actual en Codex Sites.
