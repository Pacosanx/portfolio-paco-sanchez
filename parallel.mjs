const datitaUrl = 'https://pacosanx.github.io/dddp/';
const animatedSplineIds = new Set(['277ff95f-aa50-4fee-b238-9f14700d61b4', 'f2f3679d-1061-4ba8-b3cb-2e522cebad25', '42aa6b5a-d1cc-4641-981a-c06e331e688a', '7f12c271-74f7-4edb-ae97-8b707b80e30d', 'b1e3b2dd-450d-4227-95cc-a65cde664cba', '27394b5f-0f8b-42c0-bfb3-672198ee0fee', 'fe584f03-f2ec-49e1-9cfa-ed4e697ce654', 'c64c99f1-269f-4e6f-9f96-5e744b38f604', 'd3705c2c-6885-4ee1-9dd6-52e10fcfdfcc', 'da95f481-47b1-4efb-949f-bf5ab74ff6d2', '717e0ceb-4e8e-4ab3-84c2-0e928f4d3943']);
const recordedSplineIds = new Set(['277ff95f-aa50-4fee-b238-9f14700d61b4', 'f2f3679d-1061-4ba8-b3cb-2e522cebad25', '42aa6b5a-d1cc-4641-981a-c06e331e688a', '7f12c271-74f7-4edb-ae97-8b707b80e30d', 'b1e3b2dd-450d-4227-95cc-a65cde664cba', '27394b5f-0f8b-42c0-bfb3-672198ee0fee', 'fe584f03-f2ec-49e1-9cfa-ed4e697ce654', 'c64c99f1-269f-4e6f-9f96-5e744b38f604', 'd3705c2c-6885-4ee1-9dd6-52e10fcfdfcc', 'da95f481-47b1-4efb-949f-bf5ab74ff6d2', '717e0ceb-4e8e-4ab3-84c2-0e928f4d3943']);
const splinePreviewVersions = {
  'da95f481-47b1-4efb-949f-bf5ab74ff6d2': 'single',
  '717e0ceb-4e8e-4ab3-84c2-0e928f4d3943': 'loop6'
};
const splinePreviewSizes = {
  '277ff95f-aa50-4fee-b238-9f14700d61b4': [149, 152],
  'f2f3679d-1061-4ba8-b3cb-2e522cebad25': [232, 202],
  '42aa6b5a-d1cc-4641-981a-c06e331e688a': [140, 152],
  '7f12c271-74f7-4edb-ae97-8b707b80e30d': [254, 152],
  'b1e3b2dd-450d-4227-95cc-a65cde664cba': [194, 152],
  '27394b5f-0f8b-42c0-bfb3-672198ee0fee': [140, 152],
  'fe584f03-f2ec-49e1-9cfa-ed4e697ce654': [380, 138],
  'c64c99f1-269f-4e6f-9f96-5e744b38f604': [185, 202],
  'd3705c2c-6885-4ee1-9dd6-52e10fcfdfcc': [149, 152],
  'da95f481-47b1-4efb-949f-bf5ab74ff6d2': [400, 201],
  'a24cd409-128c-4fae-9247-e804da95457c': [149, 152],
  '717e0ceb-4e8e-4ab3-84c2-0e928f4d3943': [280, 233]
};
const splineExplorations = [
  '277ff95f-aa50-4fee-b238-9f14700d61b4',
  'f2f3679d-1061-4ba8-b3cb-2e522cebad25',
  '42aa6b5a-d1cc-4641-981a-c06e331e688a',
  '7f12c271-74f7-4edb-ae97-8b707b80e30d',
  'b1e3b2dd-450d-4227-95cc-a65cde664cba',
  '27394b5f-0f8b-42c0-bfb3-672198ee0fee',
  'fe584f03-f2ec-49e1-9cfa-ed4e697ce654',
  'c64c99f1-269f-4e6f-9f96-5e744b38f604',
  'd3705c2c-6885-4ee1-9dd6-52e10fcfdfcc',
  'da95f481-47b1-4efb-949f-bf5ab74ff6d2',
  'a24cd409-128c-4fae-9247-e804da95457c',
  '717e0ceb-4e8e-4ab3-84c2-0e928f4d3943',
].map((id, index) => {
  const [width, height] = splinePreviewSizes[id] || [1304, 624];
  return {
    number: String(index + 1).padStart(2, '0'),
    url: `https://app.spline.design/file/${id}`,
    preview: id === 'a24cd409-128c-4fae-9247-e804da95457c' ? '/assets/spline/a24cd409-128c-4fae-9247-e804da95457c-centered.png' : animatedSplineIds.has(id) ? `/assets/spline/${id}.jpg` : `https://filespreview.spline.design/${id}.jpg`,
    video: animatedSplineIds.has(id) ? `/assets/spline/${id}.${recordedSplineIds.has(id) ? 'webm' : 'mp4'}` : null,
    loop: id !== 'da95f481-47b1-4efb-949f-bf5ab74ff6d2',
    width,
    height
  };
});
const mediaExplorations = [
  { number: '13', tool: 'Blender', title: 'Blender — 0001-0096', preview: '/assets/spline/blender-0001-0096.jpg', video: '/assets/spline/blender-0001-0096.mp4', width: 360, height: 203 },
  { number: '14', tool: 'TouchDesigner', title: 'TouchDesigner — TDMovieOut', preview: '/assets/spline/touchdesigner-movieout-011111.jpg', video: '/assets/spline/touchdesigner-movieout-011111.mp4', width: 360, height: 203 }, 
  { number: '15', tool: 'TouchDesigner', title: 'TouchDesigner — DILLOM (Irreversible)', preview: '/assets/spline/touchdesigner-dillom-irreversible.jpg', video: '/assets/spline/touchdesigner-dillom-irreversible.mp4', width: 360, height: 203 }, 
  { number: '16', tool: 'Blender', title: 'Piraña — modelado y animación 3D', preview: '/assets/previews/pirana-modelado-3d-v2-01.webp', video: '/assets/previews/pirana-depth-of-field.mp4', width: 719, height: 540 }
];
const explorations = [...splineExplorations, ...mediaExplorations];
const renderExploration = (item, sitePath, decorative = false) => {
  const title = item.title || 'Exploración en Spline';
  const preview = item.preview.startsWith('/assets/') ? sitePath(item.preview) : item.preview;
  const loop = item.loop === false ? "" : " loop";
  const image = item.video ? `<video data-gallery-video data-src="${sitePath(item.video)}" poster="${preview}" width="${item.width}" height="${item.height}" muted${loop} playsinline preload="none" aria-hidden="true"></video>` : `<img src="${preview}" width="${item.width}" height="${item.height}" alt="Vista previa de ${title}" loading="eager" decoding="async">`;
  const caption = `<span class="lab-entry-caption"><span class="lab-entry-number mono">${item.number}</span><span class="lab-entry-title">${title}</span>${item.tool ? '' : '<span class="lab-entry-action">Ver escena</span>'}</span>`;

  if (item.tool) return `<div class="lab-entry lab-entry-media">${image}${caption}</div>`;

  return `<a class="lab-entry" draggable="false" href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="Abrir exploración ${item.number} en Spline">${image}${caption}</a>`;
};

export function parallelSection(sitePath = route => route) {
  return `<section id="en-paralelo" class="parallel" aria-labelledby="parallel-title">
  <h2 class="eyebrow" id="parallel-title">En paralelo</h2>
  <article class="datita resource-entry" aria-labelledby="datita-title">
    <div class="datita-heading resource-heading"><p class="resource-kicker mono">Recursos compartidos</p><h3 id="datita-title">Datita digital<br>de Paco.</h3></div>
    <div class="datita-context resource-context"><p>Una colección de herramientas digitales que uso para diseñar, experimentar y compartir con colegas y estudiantes.</p><p class="resource-note">Imagen, código, 3D, movimiento y tipografía.<br>Herramientas ajenas, curiosidad propia.</p></div>
    <a class="datita-preview" href="${datitaUrl}" target="_blank" rel="noopener noreferrer" aria-label="Explorar Datita digital de Paco"><img src="${sitePath('/assets/dddp-preview.png')}" width="1896" height="1078" alt="Datita digital de Paco: buscador, filtros y categorías de herramientas, con una trama de píxeles amarillos" loading="lazy" decoding="async"></a>
    <a class="text-link datita-link resource-link" href="${datitaUrl}" target="_blank" rel="noopener noreferrer">Explorar Datita</a>
  </article>
  <article class="lab" aria-labelledby="lab-title">
    <div class="lab-heading"><p class="resource-kicker mono">Pruebas gráficas y técnicas</p><h3 id="lab-title">Exploraciones.</h3><p class="lab-description">Forma, espacio e interacción en Spline, TouchDesigner y Blender.</p></div>
    <div class="lab-gallery" role="region" tabindex="0" aria-label="Galería horizontal infinita de exploraciones en Spline, TouchDesigner y Blender">
      <div class="lab-track">
        <div class="lab-set">${explorations.map(item => renderExploration(item, sitePath)).join('')}</div>
        <div class="lab-set" aria-hidden="true" inert>${explorations.map(item => renderExploration(item, sitePath, true)).join('')}</div>
      </div>
    </div>
  </article>
</section>`;
}
