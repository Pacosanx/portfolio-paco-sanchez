(() => {
  const index=document.querySelector('#project-index');
  const control=document.querySelector('#project-filter');
  const result=document.querySelector('[data-filter-result]');
  const more=document.querySelector('[data-project-more]');
  if(!index||!control)return;
  const rows=[...index.querySelectorAll('.project-row')];
  let expanded=false;
  const render=()=>{
    const category=control.value;
    const all=category==='todos';
    rows.forEach(row=>{
      row.hidden=all?(!expanded&&row.hasAttribute('data-overflow')):!row.dataset.categories.split(' ').includes(category);
    });
    const count=rows.filter(row=>!row.hidden).length;
    result.textContent=count+' de '+rows.length+' proyectos';
    more.hidden=!all||rows.length<=15;
    more.textContent=expanded?'Mostrar menos':'Ver '+(rows.length-15)+' proyectos más';
    more.setAttribute('aria-expanded',String(expanded));
    document.dispatchEvent(new CustomEvent('portfolio:filter'));
  };
  control.addEventListener('change',()=>{
    const section=index.closest('.work-section');
    const returnToStart=section.getBoundingClientRect().top<48;
    expanded=false;render();
    if(returnToStart)window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top-48,behavior:'instant'});
  });
  more.addEventListener('click',()=>{expanded=!expanded;render();if(!expanded)more.scrollIntoView({block:'nearest',behavior:'instant'})});
  document.addEventListener('portfolio:reveal',event=>{
    const row=rows.find(row=>row.getAttribute('href')===event.detail?.route);
    if(row?.hidden){control.value='todos';expanded=true;render()}
  });
  render();
})();
