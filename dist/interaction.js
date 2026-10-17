(() => {
  const viewer=document.querySelector('#project-viewer');
  if(!viewer||typeof viewer.showModal!=='function')return;
  const content=viewer.querySelector('[data-viewer-content]');
  const counter=viewer.querySelector('[data-viewer-index]');
  const templates=[...document.querySelectorAll('[data-project-template]')];
  const byRoute=new Map(templates.map(t=>[t.dataset.projectRoute,t]));
  const bySlug=new Map(templates.map(t=>[t.dataset.projectSlug,t]));
  const baseTitle=document.title;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)');
  const originalScrollRestoration=history.scrollRestoration;
  let activeRoute='',returnFocus=null,returnScroll=0,closeTimer,changeTimer,leaving=false;
  const projectFromHash=()=>{
    if(!location.hash.startsWith('#proyecto/'))return null;
    try{return bySlug.get(decodeURIComponent(location.hash.slice(10)))}catch{return null}
  };
  const fill=template=>{
    viewer.style.cssText=template.dataset.projectTheme||'';
    content.replaceChildren(template.content.cloneNode(true));
    const filtered=document.querySelector('#project-filter')?.dataset.value;
    const searching=document.querySelector('#project-program')?.value.trim();
    if((filtered&&filtered!=='todos')||searching){
      const visible=[...document.querySelectorAll('.project-row')].filter(row=>!row.hidden);
      const position=visible.findIndex(row=>row.getAttribute('href')===template.dataset.projectRoute);
      if(position>=0){
        const next=visible[position+1],link=content.querySelector('.next-project');
        link.href=next?next.getAttribute('href'):(document.documentElement.dataset.basePath||'')+'/#proyectos';
        link.querySelector('.eyebrow').textContent=next?'Siguiente proyecto':'Fin de la selección';
        link.querySelector('span:last-child').textContent=next?next.querySelector('h3').textContent:'Volver a proyectos';
        if(next)link.removeAttribute('data-close-project');else link.setAttribute('data-close-project','');
      }
    }
    counter.textContent=template.dataset.projectKind==='development'?`En desarrollo / ${String(Number(template.dataset.projectIndex)+1).padStart(2,'0')} de ${template.dataset.projectCount}`:`Proyecto / ${String(Number(template.dataset.projectIndex)+1).padStart(2,'0')} de ${templates.filter(t=>t.dataset.projectKind!=='development').length}`;
    document.title=`${template.dataset.projectTitle} — Paco Sanchez`;
    viewer.scrollTop=0;
  };
  const show=template=>{
    clearTimeout(closeTimer);
    const wasOpen=viewer.open;
    const changed=activeRoute!==template.dataset.projectRoute;
    if(wasOpen&&!changed){viewer.classList.add('is-visible');return}
    clearTimeout(changeTimer);
    activeRoute=template.dataset.projectRoute;
    document.dispatchEvent(new CustomEvent('portfolio:reveal',{detail:{route:activeRoute}}));
    if(!wasOpen){
      history.scrollRestoration='manual';
      const state=history.state?.portfolioProject;
      returnScroll=state?.scrollY??Math.max(0,document.querySelector('#proyectos').getBoundingClientRect().top+window.scrollY-48);
      returnFocus=document.activeElement?.closest('.project-row, .development-project')||document.querySelector(`.project-row[href="${activeRoute}"], .development-project[href="${activeRoute}"]`);
      fill(template);
      content.classList.remove('is-changing');
      document.documentElement.classList.add('viewer-open');
      viewer.showModal();
      viewer.getBoundingClientRect();
    }else if(changed){
      content.classList.add('is-changing');
      changeTimer=setTimeout(()=>{
        fill(template);content.classList.remove('is-changing');
        content.querySelector('#viewer-title').focus({preventScroll:true});
      },reducedMotion.matches?0:140);
    }
    viewer.classList.add('is-visible');
  };
  const hide=()=>{
    if(!viewer.open)return;
    clearTimeout(changeTimer);clearTimeout(closeTimer);
    activeRoute='';
    viewer.classList.remove('is-visible');
    document.title=baseTitle;
    closeTimer=setTimeout(()=>{
      viewer.close();
      viewer.removeAttribute('style');
      document.documentElement.classList.remove('viewer-open');
      content.replaceChildren();content.classList.remove('is-changing');activeRoute='';
      returnFocus?.focus({preventScroll:true});
      window.scrollTo({top:returnScroll,behavior:'instant'});
      history.scrollRestoration=originalScrollRestoration;
    },reducedMotion.matches?0:480);
  };
  const sync=()=>{leaving=false;const project=projectFromHash();project?show(project):hide()};
  const open=template=>{
    history.scrollRestoration='manual';
    const previous=history.state?.portfolioProject;
    const state=viewer.open&&previous?{...previous,depth:previous.depth+1}:{baseUrl:location.pathname+location.search+location.hash,depth:1,scrollY:window.scrollY};
    if(state.baseUrl.includes('#proyecto/'))state.baseUrl=location.pathname+location.search+'#proyectos';
    history.pushState({...history.state,portfolioProject:state},'',`#proyecto/${encodeURIComponent(template.dataset.projectSlug)}`);
    show(template);
  };
  const close=()=>{
    if(leaving||!viewer.open)return;
    const state=history.state?.portfolioProject;
    if(state?.depth>0){leaving=true;history.go(-state.depth)}
    else{history.replaceState(history.state,'',location.pathname+location.search+'#proyectos');hide()}
  };
  document.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const row=event.target.closest('.project-row, .development-project');
    const next=event.target.closest('#project-viewer .next-project');
    const template=byRoute.get((row||next)?.getAttribute('href'));
    if(template){event.preventDefault();open(template)}
  });
  viewer.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const stageLink=event.target.closest('.development-stage-nav a');
    if(stageLink){
      const target=content.querySelector(stageLink.getAttribute('href'));
      if(target){event.preventDefault();target.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});}
      return;
    }
    if(event.target.closest('[data-close-project]')){event.preventDefault();close()}
    else if(event.target===viewer&&event.clientX<viewer.getBoundingClientRect().left)close();
  });
  viewer.addEventListener('cancel',event=>{event.preventDefault();close()});
  window.addEventListener('popstate',sync);
  window.addEventListener('hashchange',sync);
  sync();
})();
