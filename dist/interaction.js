(() => {
  const index=document.querySelector('.work-index');
  const stage=document.querySelector('.preview-stage');
  if(!index||!stage)return;
  const image=stage.querySelector('.preview-image');
  const name=stage.querySelector('[data-preview-name]');
  const year=stage.querySelector('[data-preview-year]');
  const discipline=stage.querySelector('.preview-discipline');
  const media=window.matchMedia('(min-width:1001px) and (hover:hover)');
  const rows=[...index.querySelectorAll('.project-row')];
  const cache=new Map();
  let data=[],active=-1,selected=-1,request=0;
  const preload=(i)=>{
    if(!data[i])return null;
    if(!cache.has(i)){const img=new Image();img.src=data[i].src;cache.set(i,img)}
    return cache.get(i);
  };
  const show=async(i)=>{
    selected=i;
    if(!media.matches||!data[i])return;
    const token=++request;
    rows.forEach((row,j)=>row.classList.toggle('is-active',j===i));
    if(i===active){stage.classList.add('is-visible');return}
    const preloaded=preload(i);
    stage.classList.remove('is-visible');
    try{if(!preloaded.complete)await preloaded.decode()}catch{return}
    if(token!==request||selected!==i||!media.matches||!preloaded.naturalWidth)return;
    image.src=data[i].src;name.textContent=data[i].name;year.textContent=data[i].year;discipline.textContent=data[i].discipline;
    active=i;stage.classList.add('is-visible');preload(i+1);
  };
  const hide=()=>{++request;selected=-1;stage.classList.remove('is-visible');rows.forEach(row=>row.classList.remove('is-active'))};
  rows.forEach((row,i)=>{row.addEventListener('pointerenter',()=>show(i));row.addEventListener('focus',()=>show(i));row.addEventListener('blur',()=>{if(!index.contains(document.activeElement))hide()})});
  index.addEventListener('pointerleave',()=>{if(!index.contains(document.activeElement))hide()});
  media.addEventListener('change',hide);
  fetch('/preview-data.json').then(r=>{if(!r.ok)throw new Error('previews');return r.json()}).then(records=>{data=records;if(media.matches)preload(0);if(selected>=0)show(selected)}).catch(()=>{});
})();

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
    content.replaceChildren(template.content.cloneNode(true));
    counter.textContent=`Proyecto / ${String(Number(template.dataset.projectIndex)+1).padStart(2,'0')} de ${templates.length}`;
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
    if(!wasOpen){
      history.scrollRestoration='manual';
      const state=history.state?.portfolioProject;
      returnScroll=state?.scrollY??Math.max(0,document.querySelector('#proyectos').getBoundingClientRect().top+window.scrollY-48);
      returnFocus=document.activeElement?.closest('.project-row')||document.querySelector(`.project-row[href="${activeRoute}"]`);
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
    const row=event.target.closest('.project-row');
    const next=event.target.closest('#project-viewer .next-project');
    const template=byRoute.get((row||next)?.getAttribute('href'));
    if(template){event.preventDefault();open(template)}
  });
  viewer.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(event.target.closest('[data-close-project]')){event.preventDefault();close()}
    else if(event.target===viewer&&event.clientX<viewer.getBoundingClientRect().left)close();
  });
  viewer.addEventListener('cancel',event=>{event.preventDefault();close()});
  window.addEventListener('popstate',sync);
  window.addEventListener('hashchange',sync);
  sync();
})();
