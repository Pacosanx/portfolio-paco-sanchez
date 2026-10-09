export const categories=[
  {id:'web',label:'Web e interactividad',group:'Diseño digital',match:/web|interactividad/i},
  {id:'realidades',label:'VR y realidad aumentada',group:'Diseño digital',match:/realidad|filtros/i},
  {id:'movimiento',label:'Movimiento y 3D',group:'Diseño digital',match:/movimiento|video|cinética|motion|animación|3d|modelado/i},
  {id:'editorial',label:'Editorial',group:'Gráfica y editorial',match:/editorial|fanzine/i},
  {id:'grafica',label:'Gráfica e identidad',group:'Gráfica y editorial',match:/identidad|sistema|afiche|esquemática|lenguajes|narrativa|gráfica/i}
];
export const projectCategories=p=>categories.filter(c=>c.match.test(p.discipline+' '+p.title)).map(c=>c.id);
export function projectFilters(projects){
  const option=(id,label)=>`<button type="button" data-filter-value="${id}" data-filter-label="${label}" aria-pressed="${id==='todos'}" aria-controls="project-index">${label}</button>`;
  const options=group=>categories.filter(c=>c.group===group).map(c=>option(c.id,c.label)).join('');
  return `<div class="project-filters"><p id="filter-label">Explorar por área</p><details id="project-filter" class="filter-picker" data-value="todos"><summary aria-describedby="filter-label" aria-controls="project-filter-options"><span data-filter-label-current>Todos los proyectos</span><span class="filter-action">Elegir</span></summary><div id="project-filter-options" class="filter-options" role="group" aria-label="Área del proyecto">${option('todos','Todos los proyectos')}<div class="filter-group"><p class="mono">Diseño digital</p>${options('Diseño digital')}</div><div class="filter-group"><p class="mono">Gráfica y editorial</p>${options('Gráfica y editorial')}</div></div></details><div class="program-search"><label for="project-program">Buscar por programa</label><div class="program-search-field"><input id="project-program" type="search" placeholder="Ej. TouchDesigner, Unity…" autocomplete="off" aria-controls="project-index"><button type="button" data-program-clear hidden aria-label="Limpiar búsqueda por programa">Limpiar</button></div></div></div><p class="filter-result mono" data-filter-result role="status">${Math.min(15,projects.length)} de ${projects.length} proyectos</p>`;
}
