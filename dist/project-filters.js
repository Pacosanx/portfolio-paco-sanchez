(() => {
  const index=document.querySelector('#project-index');
  const controls=[...document.querySelectorAll('[data-project-filter]')];
  const result=document.querySelector('[data-filter-result]');
  if(!index||!controls.length)return;
  const rows=[...index.querySelectorAll('.project-row')];
  controls.forEach(control=>control.addEventListener('click',()=>{
    const category=control.dataset.projectFilter;
    const section=index.closest('.work-section');
    const returnToStart=section.getBoundingClientRect().top<48;
    controls.forEach(button=>button.setAttribute('aria-pressed',String(button===control)));
    rows.forEach(row=>{row.hidden=category!=='todos'&&!row.dataset.categories.split(' ').includes(category)});
    const count=rows.filter(row=>!row.hidden).length;
    result.textContent=`${count} de ${rows.length} proyectos`;
    document.dispatchEvent(new CustomEvent('portfolio:filter'));
    if(returnToStart)window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top-48,behavior:'instant'});
  }));
})();
