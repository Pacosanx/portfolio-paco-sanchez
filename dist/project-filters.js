(() => {
  const index=document.querySelector('#project-index');
  const control=document.querySelector('#project-filter');
  const result=document.querySelector('[data-filter-result]');
  const more=document.querySelector('[data-project-more]');
  const search=document.querySelector('#project-program');
  const clear=document.querySelector('[data-program-clear]');
  const empty=document.querySelector('[data-project-empty]');
  const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!index||!control)return;
  const rows=[...index.querySelectorAll('.project-row')];
  const options=[...control.querySelectorAll('[data-filter-value]')];
  const trigger=control.querySelector('summary');
  const place=()=>{
    if(!control.open)return;
    const rect=control.getBoundingClientRect(),below=window.innerHeight-rect.bottom-20,above=rect.top-20;
    const up=below<220&&above>below;
    control.classList.toggle('opens-up',up);
    control.querySelector('.filter-options').style.setProperty('--filter-space',Math.max(80,up?above:below)+'px');
  };
  control.addEventListener('toggle',place);
  window.addEventListener('resize',place);
  window.addEventListener('scroll',place,{passive:true});
  let expanded=false;
  const render=()=>{
    const category=control.dataset.value;
    options.forEach(option=>option.setAttribute('aria-pressed',String(option.dataset.filterValue===category)));
    control.querySelector('[data-filter-label-current]').textContent=options.find(option=>option.dataset.filterValue===category).dataset.filterLabel;
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
    empty.hidden=count>0;
    more.textContent=expanded?'Mostrar menos':'Ver '+(rows.length-15)+' proyectos más';
    more.setAttribute('aria-expanded',String(expanded));
    document.dispatchEvent(new CustomEvent('portfolio:filter'));
  };
  search.addEventListener('input',()=>{expanded=false;render()});
  clear.addEventListener('click',()=>{search.value='';expanded=false;render();search.focus({preventScroll:true})});
  search.addEventListener('keydown',event=>{if(event.key==='Escape'&&search.value){event.preventDefault();event.stopPropagation();search.value='';expanded=false;render()}});
  options.forEach(option=>option.addEventListener('click',()=>{
    const section=index.closest('.work-section');
    const returnToStart=section.getBoundingClientRect().top<48;
    control.dataset.value=option.dataset.filterValue;
    control.open=false;
    expanded=false;render();
    trigger.focus({preventScroll:true});
    if(returnToStart)window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top-48,behavior:'instant'});
  }));
  control.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&control.open){event.preventDefault();event.stopPropagation();control.open=false;trigger.focus({preventScroll:true});return}
    const at=options.indexOf(document.activeElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();control.open=true;
      const next=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowDown'?(at+1)%options.length:(at<0?options.length-1:(at+options.length-1)%options.length);
      options[next].focus({preventScroll:true});
    }
  });
  document.addEventListener('click',event=>{if(!control.contains(event.target))control.open=false});
  more.addEventListener('click',()=>{expanded=!expanded;render();if(!expanded)more.scrollIntoView({block:'nearest',behavior:'instant'})});
  document.addEventListener('portfolio:reveal',event=>{
    const row=rows.find(row=>row.getAttribute('href')===event.detail?.route);
    if(row?.hidden){control.dataset.value='todos';search.value='';control.open=false;expanded=true;render()}
  });
  render();
})();
