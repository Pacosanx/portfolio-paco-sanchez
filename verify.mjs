import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const content=JSON.parse(fs.readFileSync('content.json','utf8'));
const home=fs.readFileSync('dist/index.html','utf8');
assert.equal(content.projects.length,12);
assert.equal((home.match(/class="project-row"/g)||[]).length,12);
assert.equal((home.match(/<template data-project-template/g)||[]).length,12);
assert(!home.includes('wa.me/')&&!home.includes('WhatsApp'));
assert(!home.includes('/proyectos/algo-esta-mutando')&&!home.includes('/proyectos/editorial-tipografico-2021'));
assert(home.includes('Universidad Torcuato Di Tella')&&home.includes('Longinotti 2')&&home.includes('Longinotti 1'));
assert.equal((home.match(/class="cv-table"/g)||[]).length,2);
assert(home.includes('<dialog id="project-viewer"'));
assert(home.includes('src="/assets/dddp-preview.jpg"'));
const htmlFiles=['dist/index.html',...content.projects.map(p=>path.join('dist',p.ruta,'index.html'))];
let links=0,images=0;
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,file);
  assert(!/[↗↘↙↖→←↑↓]/u.test(html),'Arrow glyph in '+file);
  assert(!html.includes('Spline 2'),'Removed 3D scene');
  for(const match of html.matchAll(/href="([^"#]+)(?:#[^"]*)?"/g)){
    const href=match[1];
    if(!href.startsWith('/')||href.startsWith('//'))continue;
    let target=path.join('dist',href);
    if(!path.extname(target))target=path.join(target,'index.html');
    assert(fs.existsSync(target),`${file}: missing ${href}`);links++;
  }
  for(const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)){
    const src=match[1];
    assert(src.startsWith('https://')||(src.startsWith('/')&&fs.existsSync(path.join('dist',src))),`${file}: invalid image source ${src.slice(0,100)}`);images++;
  }
}
for(const [i,p] of content.projects.entries()){
  const html=fs.readFileSync(htmlFiles[i+1],'utf8');
  const blocks=p.blocks||p.imagenes.map(image=>({type:'image',...image}));
  const galleryImages=blocks.flatMap(b=>b.type==='image'?[b]:b.type==='gallery'?b.images:[]);
  assert.equal((html.match(/class="case-figure"/g)||[]).length,galleryImages.length,p.title);
  for(const image of galleryImages)assert(html.includes(image.url.replaceAll('&','&amp;')),p.title);
  for(const block of blocks){
    assert(['image','gallery','text','embed','video'].includes(block.type),p.title);
    if(block.type==='embed')assert(html.includes(block.url.replaceAll('&','&amp;')),p.title);
    for(const link of block.links||[])assert(html.includes(link.href.replaceAll('&','&amp;')),p.title);
  }
  assert(html.includes(p.fuente.replaceAll('&','&amp;')),p.title);
  assert(html.includes(i<content.projects.length-1?content.projects[i+1].ruta+'/':'/#proyectos'),p.title);
}
const previews=JSON.parse(fs.readFileSync('dist/preview-data.json','utf8'));
assert.equal(previews.length,12);
for(const [i,preview] of previews.entries()){
  assert(preview.images.length>0,content.projects[i].title);
  for(const image of preview.images)assert.notEqual(image.src,content.projects[i].preview);
}
console.log(JSON.stringify({pages:htmlFiles.length,internalLinks:links,imageReferences:images,projectImages:content.projects.reduce((n,p)=>n+p.imagenes.length,0),passed:true}));
