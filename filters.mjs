export const categories=[
  {id:'web',label:'Web e interactividad',group:'Diseño digital',match:/web|interactividad/i},
  {id:'realidades',label:'VR y realidad aumentada',group:'Diseño digital',match:/realidad|filtros/i},
  {id:'movimiento',label:'Movimiento y 3D',group:'Diseño digital',match:/movimiento|video|cinética|motion|animación|3d|modelado/i},
  {id:'editorial',label:'Editorial',group:'Gráfica y editorial',match:/editorial|fanzine/i},
  {id:'grafica',label:'Gráfica e identidad',group:'Gráfica y editorial',match:/identidad|sistema|afiche|esquemática|lenguajes|narrativa|gráfica/i}
];
export const projectCategories=p=>categories.filter(c=>c.match.test(p.discipline+' '+p.title)).map(c=>c.id);
export function projectFilters(projects){
  const shortLabels={todos:'Todos',web:'Web',realidades:'VR / AR',movimiento:'Movimiento / 3D',editorial:'Editorial',grafica:'Gráfica'};
  const option=(id,label)=>`<button type="button" data-filter-value="${id}" data-filter-label="${label}" aria-label="${label}" aria-pressed="${id==='todos'}" aria-controls="project-index">${shortLabels[id]}</button>`;
  return `<div class="project-toolbar" aria-label="Explorar proyectos"><div class="project-filters"><p id="filter-label">Filtrar por área</p><div id="project-filter" class="filter-options" data-value="todos" role="group" aria-labelledby="filter-label">${option('todos','Todos los proyectos')}${categories.map(c=>option(c.id,c.label)).join('')}</div></div><div class="program-search"><label for="project-program">Buscar</label><div class="program-search-field"><input id="project-program" type="search" placeholder="Proyecto o herramienta…" autocomplete="off" aria-controls="project-index"><button type="button" data-program-clear hidden aria-label="Limpiar búsqueda">Limpiar</button></div></div><div class="project-filter-status"><p class="filter-result mono" data-filter-result role="status">${Math.min(15,projects.length)} de ${projects.length} proyectos</p><button type="button" class="filter-reset text-link" data-filter-reset hidden>Restablecer filtros</button></div></div>`;
}
