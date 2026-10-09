export const categories=[
  {id:'editorial',label:'Editorial',match:/editorial|fanzine/i},
  {id:'identidad',label:'Identidad y gráfica',match:/identidad|sistema|afiche|esquemática|lenguajes|narrativa/i},
  {id:'movimiento',label:'Movimiento',match:/movimiento|video|cinética|motion|animación/i},
  {id:'web',label:'Web',match:/web/i},
  {id:'3d',label:'3D',match:/3d|modelado/i},
  {id:'realidades',label:'VR y realidad aumentada',match:/realidad|filtros/i},
  {id:'tipografia',label:'Tipografía',match:/tipografía/i}
];
export const projectCategories=p=>categories.filter(c=>c.match.test(p.discipline)).map(c=>c.id);
export function projectFilters(projects){
  const choices=[{id:'todos',label:'Todos',count:projects.length},...categories.map(c=>({...c,count:projects.filter(p=>projectCategories(p).includes(c.id)).length})).filter(c=>c.count)];
  return `<fieldset class="project-filters"><legend>Filtrar por disciplina</legend>${choices.map(c=>`<button type="button" data-project-filter="${c.id}" aria-pressed="${c.id==='todos'}" aria-controls="project-index"><span>${c.label}</span><span class="mono">${c.count}</span></button>`).join('')}</fieldset><p class="filter-result mono" data-filter-result role="status">${projects.length} proyectos</p>`;
}
