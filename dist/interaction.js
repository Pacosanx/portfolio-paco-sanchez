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
