(() => {
  const index=document.querySelector('#project-index');
  const control=document.querySelector('#project-filter');
  const result=document.querySelector('[data-filter-result]');
  const more=document.querySelector('[data-project-more]');
  const search=document.querySelector('#project-program');
  const clear=document.querySelector('[data-program-clear]');
  const reset=document.querySelector('[data-filter-reset]');
  const empty=document.querySelector('[data-project-empty]');
  const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!index||!control)return;
  const rows=[...index.querySelectorAll('.project-row')];
  const options=[...control.querySelectorAll('[data-filter-value]')];
  let expanded=false;
  const render=()=>{
    const category=control.dataset.value;
    options.forEach(option=>option.setAttribute('aria-pressed',String(option.dataset.filterValue===category)));
    const all=category==='todos',query=normalize(search.value),filtered=!all||Boolean(query);
    rows.forEach(row=>{
      const area=all||row.dataset.categories.split(' ').includes(category);
      const matches=!query||normalize(row.dataset.search).includes(query);
      row.hidden=!area||!matches||(!filtered&&!expanded&&row.hasAttribute('data-overflow'));
    });
    const count=rows.filter(row=>!row.hidden).length;
    result.textContent=count+' de '+rows.length+' proyectos';
    more.hidden=filtered||rows.length<=15;
    clear.hidden=!search.value;
    reset.hidden=!filtered;
    empty.hidden=count>0;
    more.textContent=expanded?'Mostrar menos':'Ver '+(rows.length-15)+' proyectos más';
    more.setAttribute('aria-expanded',String(expanded));
    document.dispatchEvent(new CustomEvent('portfolio:filter'));
  };
  search.addEventListener('input',()=>{expanded=false;render()});
  clear.addEventListener('click',()=>{search.value='';expanded=false;render();search.focus({preventScroll:true})});
  search.addEventListener('keydown',event=>{if(event.key==='Escape'&&search.value){event.preventDefault();event.stopPropagation();search.value='';expanded=false;render()}});
  options.forEach(option=>option.addEventListener('click',()=>{
    control.dataset.value=option.dataset.filterValue;
    expanded=false;render();
  }));
  reset.addEventListener('click',()=>{control.dataset.value='todos';search.value='';expanded=false;render();options[0].focus({preventScroll:true})});
  control.addEventListener('keydown',event=>{
    const at=options.indexOf(document.activeElement);
    if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowRight'?(at+1)%options.length:(at<0?options.length-1:(at+options.length-1)%options.length);
      options[next].focus({preventScroll:true});
    }
  });
  more.addEventListener('click',()=>{expanded=!expanded;render();if(!expanded)more.scrollIntoView({block:'nearest',behavior:'instant'})});
  document.addEventListener('portfolio:reveal',event=>{
    const row=rows.find(row=>row.getAttribute('href')===event.detail?.route);
    if(row?.hidden){control.dataset.value='todos';search.value='';expanded=true;render()}
  });
  render();
})();
