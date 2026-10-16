const datitaUrl = 'https://datita-digital-de-paco.sanchezfrancis497029.chatgpt.site/';
const animatedSplineIds = new Set(['277ff95f-aa50-4fee-b238-9f14700d61b4', '42aa6b5a-d1cc-4641-981a-c06e331e688a', '7f12c271-74f7-4edb-ae97-8b707b80e30d', 'b1e3b2dd-450d-4227-95cc-a65cde664cba', '27394b5f-0f8b-42c0-bfb3-672198ee0fee', 'fe584f03-f2ec-49e1-9cfa-ed4e697ce654', 'c64c99f1-269f-4e6f-9f96-5e744b38f604', 'd3705c2c-6885-4ee1-9dd6-52e10fcfdfcc', 'da95f481-47b1-4efb-949f-bf5ab74ff6d2', 'a24cd409-128c-4fae-9247-e804da95457c', '717e0ceb-4e8e-4ab3-84c2-0e928f4d3943']);
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
  'eb41011f-65e3-44af-b5bb-1d8028343af2'
].map((id, index) => ({
  number: String(index + 1).padStart(2, '0'),
  url: `https://app.spline.design/file/${id}`,
  preview: animatedSplineIds.has(id) ? `/assets/spline/${id}.gif?v=20261016-loop2` : `https://filespreview.spline.design/${id}.jpg`
}));

export function parallelSection(sitePath = route => route) {
  return `<section id="en-paralelo" class="parallel" aria-labelledby="parallel-title">
  <h2 class="eyebrow" id="parallel-title">En paralelo</h2>
  <article class="datita" aria-labelledby="datita-title">
    <div class="datita-heading"><p class="resource-kicker mono">Recursos compartidos</p><h3 id="datita-title">Datita digital<br>de Paco.</h3></div>
    <div class="datita-context"><p>Una colección de herramientas digitales que uso para diseñar, experimentar y compartir con colegas y estudiantes.</p><p class="resource-note">Imagen, código, 3D, movimiento y tipografía.<br>Herramientas ajenas, curiosidad propia.</p></div>
    <a class="datita-preview" href="${datitaUrl}" target="_blank" rel="noopener noreferrer" aria-label="Explorar Datita digital de Paco"><img src="${sitePath('/assets/dddp-preview.png')}" width="1896" height="1078" alt="Datita digital de Paco: buscador, filtros y categorías de herramientas, con una trama de píxeles amarillos" loading="lazy" decoding="async"></a>
    <a class="text-link datita-link" href="${datitaUrl}" target="_blank" rel="noopener noreferrer">Explorar Datita</a>
  </article>
  <article class="lab" aria-labelledby="lab-title">
    <div class="lab-heading"><p class="resource-kicker mono">Pruebas gráficas y técnicas</p><h3 id="lab-title">Exploraciones.</h3><p class="lab-description">Estudios de forma, espacio e interacción realizados en Spline.</p></div>
    <div class="lab-gallery" aria-label="Galería horizontal de exploraciones 3D en Spline">${splineExplorations.map(item => `<a class="lab-entry" href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="Abrir exploración ${item.number} en Spline"><img src="${item.preview.startsWith('/assets/') ? sitePath(item.preview) : item.preview}" width="1304" height="624" alt="Vista previa de la exploración ${item.number}" loading="lazy" decoding="async"><span class="lab-entry-caption"><span class="lab-entry-number mono">${item.number}</span><span class="lab-entry-title">Exploración en Spline</span><span class="lab-entry-action">Ver escena</span></span></a>`).join('')}</div>
  </article>
</section>`;
}
