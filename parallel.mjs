const datitaUrl = 'https://datita-digital-de-paco.sanchezfrancis497029.chatgpt.site/';

export function parallelSection() {
  return `<section id="en-paralelo" class="parallel" aria-labelledby="parallel-title">
  <h2 class="eyebrow" id="parallel-title">En paralelo</h2>
  <article class="datita" aria-labelledby="datita-title">
    <div class="datita-heading"><p class="resource-kicker mono">Recursos compartidos</p><h3 id="datita-title">Datita digital<br>de Paco.</h3></div>
    <div class="datita-context"><p>Una colección de herramientas digitales que uso para diseñar, experimentar y compartir con colegas y estudiantes.</p><p class="resource-note">Imagen, código, 3D, movimiento y tipografía.<br>Herramientas ajenas, curiosidad propia.</p></div>
    <a class="datita-preview" href="${datitaUrl}" target="_blank" rel="noopener noreferrer" aria-label="Explorar Datita digital de Paco"><img src="/assets/dddp-preview.png" width="1896" height="1078" alt="Datita digital de Paco: buscador, filtros y categorías de herramientas, con una trama de píxeles amarillos" loading="lazy" decoding="async"></a>
    <a class="text-link datita-link" href="${datitaUrl}" target="_blank" rel="noopener noreferrer">Explorar Datita</a>
  </article>
  <article class="lab" aria-labelledby="lab-title">
    <div class="lab-heading"><p class="resource-kicker mono">Pruebas gráficas y técnicas</p><h3 id="lab-title">Laboratorio.</h3><p class="lab-description">Exploraciones en imágenes y videos, fuera de los proyectos.</p></div>
    <div class="lab-gallery" aria-label="Galería del laboratorio"><p class="lab-state mono">En preparación</p></div>
  </article>
</section>`;
}
