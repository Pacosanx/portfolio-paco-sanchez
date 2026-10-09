export const categories=[
  {id:'web',label:'Web e interactividad',group:'Diseño digital',match:/web|interactividad/i},
  {id:'realidades',label:'VR y realidad aumentada',group:'Diseño digital',match:/realidad|filtros/i},
  {id:'movimiento',label:'Movimiento y 3D',group:'Diseño digital',match:/movimiento|video|cinética|motion|animación|3d|modelado/i},
  {id:'editorial',label:'Editorial',group:'Gráfica y editorial',match:/editorial|fanzine/i},
  {id:'grafica',label:'Gráfica e identidad',group:'Gráfica y editorial',match:/identidad|sistema|afiche|esquemática|lenguajes|narrativa|gráfica/i}
];
export const projectCategories=p=>categories.filter(c=>c.match.test(p.discipline+' '+p.title)).map(c=>c.id);
export function projectFilters(projects){
  const options=group=>categories.filter(c=>c.group===group).map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
  return `<div class="project-filters"><label for="project-filter">Explorar por área</label><select id="project-filter" aria-controls="project-index"><option value="todos">Todos los proyectos</option><optgroup label="Diseño digital">${options('Diseño digital')}</optgroup><optgroup label="Gráfica y editorial">${options('Gráfica y editorial')}</optgroup></select></div><p class="filter-result mono" data-filter-result role="status">${Math.min(15,projects.length)} de ${projects.length} proyectos</p>`;
}
