import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const content=JSON.parse(fs.readFileSync('content.json','utf8'));
const projects=content.projects.filter(p=>!['/proyectos/algo-esta-mutando','/proyectos/editorial-tipografico-2021','/proyectos/pirana-modelado-3d'].includes(p.ruta));
const home=fs.readFileSync('dist/index.html','utf8');
const basePath=(home.match(/data-base-path="([^"]*)"/)||[])[1]||'';
const assetUrl=url=>url.startsWith('/')&&!url.startsWith('//')?basePath+url:url;
const localPath=url=>path.join('dist',url.split(/[?#]/)[0].slice(basePath.length));
assert.equal((home.match(/class="project-row"/g)||[]).length,projects.length);
const developmentProjects=JSON.parse(fs.readFileSync('development-projects.json','utf8'));
assert.equal((home.match(/<template data-project-template/g)||[]).length,projects.length+developmentProjects.length);
assert.equal((home.match(/data-project-kind="development"/g)||[]).length,developmentProjects.length);
assert(home.includes('id="project-filter"')&&home.includes('aria-controls="project-index"'));
assert.equal((home.match(/data-overflow hidden/g)||[]).length,Math.max(0,projects.length-15));
assert.equal(projects[0].ruta,'/proyectos/metaphex');
assert(projects.some(p=>p.ruta==='/proyectos/historias-instagram'));
assert(!home.includes('class="touch-preview"'));
assert(!home.includes('Índice de proyectos'));
assert.equal((home.match(/Auxiliar docente de /g)||[]).length,3);
assert(home.includes('id="project-filter" class="filter-options"')&&home.includes('aria-labelledby="filter-label"'));
assert.equal((home.match(/data-filter-value=/g)||[]).length,6);
assert.equal((home.match(/data-categories="[^"]+"/g)||[]).length,projects.length);
assert(!home.includes('wa.me/')&&!home.includes('WhatsApp'));
assert(!home.includes('/proyectos/algo-esta-mutando')&&!home.includes('/proyectos/editorial-tipografico-2021'));
assert(home.includes('Universidad Torcuato Di Tella')&&home.includes('Cátedra Longinotti'));
assert(home.includes('Morfología II')&&home.includes('Morfología I'));
assert(home.includes('Omar Díaz Fotografía'));
assert(home.includes('<br>Universidad Torcuato Di Tella'));
assert(home.includes('data-search=')&&home.includes('project-format'));
assert(!home.includes('Estoy trabajando en estos dos proyectos'));
assert(fs.existsSync('dist/assets/previews/pirana-depth-of-field.mp4')&&home.includes('pirana-depth-of-field.mp4'));
assert(home.includes('id="development-title">En proceso</h2>'));
assert.equal((home.match(/class="cv-table"/g)||[]).length,2);
assert(home.includes('<dialog id="project-viewer"'));
assert(home.includes(`src="${basePath}/assets/dddp-preview.png"`));
const htmlFiles=['dist/index.html',...projects.map(p=>path.join('dist',p.ruta,'index.html'))];
let links=0,images=0;
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,file);
  assert(!/[↗↘↙↖→←↑↓]/u.test(html),'Arrow glyph in '+file);
  assert(!html.includes('Spline 2</h'),'Removed 3D scene');
  for(const match of html.matchAll(/href="([^"#]+)(?:#[^"]*)?"/g)){
    const href=match[1].split('?')[0];
    if(!href.startsWith('/')||href.startsWith('//'))continue;
    let target=localPath(href);
    if(!path.extname(target))target=path.join(target,'index.html');
    assert(fs.existsSync(target),`${file}: missing ${href}`);links++;
  }
  for(const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)){
    const src=match[1];
    assert(src.startsWith('https://')||(src.startsWith('/')&&fs.existsSync(localPath(src))),`${file}: invalid image source ${src.slice(0,100)}`);images++;
  }
  for(const match of html.matchAll(/<img\b[^>]*\bsrcset="([^"]+)"/g)){
    for(const candidate of match[1].split(',')){
      const src=candidate.trim().split(/\s+/)[0];
      if(src.startsWith('/'))assert(fs.existsSync(localPath(src)),`${file}: missing responsive image ${src}`);
    }
  }
}
for(const [i,p] of projects.entries()){
  const html=fs.readFileSync(htmlFiles[i+1],'utf8');
  const blocks=p.blocks||p.imagenes.map(image=>({type:'image',...image}));
  const galleryImages=blocks.flatMap(b=>b.type==='image'?[b]:b.type==='gallery'?b.images:[]);
  assert.equal((html.match(/class="case-figure(?: is-(?:detail|overview|bleed))?"/g)||[]).length,galleryImages.length,p.title);
  for(const image of galleryImages)assert(html.includes(assetUrl(image.url).replaceAll('&','&amp;')),p.title);
  for(const block of blocks){
    assert(['image','gallery','text','embed','video','interactive','statement','placeholder'].includes(block.type),p.title);
    if(block.type==='placeholder')assert(block.title&&html.includes(block.title.replaceAll('&','&amp;'))&&html.includes('case-placeholder-panel'),p.title);
    if(block.type==='embed')assert(html.includes(block.url.replaceAll('&','&amp;')),p.title);
    if(block.type==='interactive')assert(html.includes('<inmson-drawing>')&&html.includes('inmson-drawing.js'),p.title);
    if(block.type==='statement'){assert(html.includes(block.text.replaceAll('&','&amp;')),p.title);if(block.label)assert(html.includes(block.label.replaceAll('&','&amp;')),p.title);}
    if(block.type==='video')assert(html.includes(assetUrl(block.url).replaceAll('&','&amp;'))&&fs.existsSync(path.join('dist',block.url)),p.title);
    if(block.type==='gallery')assert(block.images.length&&(!block.columns||(block.columns>=1&&block.columns<=4)),p.title);
    for(const link of block.links||[])assert(html.includes(link.href.replaceAll('&','&amp;')),p.title);
  }
  if(p.fuente)assert(html.includes(assetUrl(p.fuente).replaceAll('&','&amp;')),p.title);
  if(p.theme)assert(html.includes(`--bg:${p.theme.bg}`),`${p.title}: missing project canvas color`);
  for(const link of p.links||[])assert(html.includes(link.href.replaceAll('&','&amp;')),p.title);
  assert(html.includes(i<projects.length-1?projects[i+1].ruta+'/':'/#proyectos'),p.title);
}
const previews=JSON.parse(fs.readFileSync('dist/preview-data.json','utf8'));
assert.equal(previews.length,projects.length);
for(const [i,preview] of previews.entries()){
  assert(preview.images.length>=3,`${projects[i].title}: at least three previews required`);
  assert.equal(preview.images[0].role,'whole',`${projects[i].title}: the first preview must show the complete piece`);
  for(const image of preview.images.flatMap(image=>[image,...(image.layers||[])])){
    assert(image.width>0&&image.height>0,projects[i].title);
    if(image.src.startsWith('/')){
      const file=localPath(image.src);
      assert(fs.existsSync(file),image.src);
      if(/\.png$/i.test(file))assert.equal(fs.readFileSync(file).subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${image.src}: invalid PNG signature`);
    }
    if(image.crop){
      const c=image.crop;
      assert(c.x>=0&&c.y>=0&&c.width>0&&c.height>0&&c.x+c.width<=1.001&&c.y+c.height<=1.001,`${image.src}: invalid crop`);
    }
    if(image.clipPath)assert(/^(polygon|inset)\([\d\s.,%+-]+\)$/.test(image.clipPath),`${image.src}: invalid image clipping path`);
  }
  if(projects[i].imagenes.length)for(const image of preview.images)assert.notEqual(image.src,projects[i].preview);
}
console.log(JSON.stringify({pages:htmlFiles.length,internalLinks:links,imageReferences:images,projectImages:projects.reduce((n,p)=>n+p.imagenes.length,0),passed:true}));

