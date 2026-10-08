import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const content=JSON.parse(fs.readFileSync('content.json','utf8'));
const home=fs.readFileSync('dist/index.html','utf8');
assert.equal(content.projects.length,14);
assert.equal((home.match(/class="project-row"/g)||[]).length,14);
assert.equal((home.match(/<template data-project-template/g)||[]).length,14);
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
  assert.equal((html.match(/class="case-figure"/g)||[]).length,p.imagenes.length,p.title);
  for(const image of p.imagenes)assert(html.includes(image.url.replaceAll('&','&amp;')),p.title);
  assert(html.includes(p.fuente.replaceAll('&','&amp;')),p.title);
  assert(html.includes(i<13?content.projects[i+1].ruta+'/':'/#proyectos'),p.title);
}
console.log(JSON.stringify({pages:htmlFiles.length,internalLinks:links,imageReferences:images,projectImages:content.projects.reduce((n,p)=>n+p.imagenes.length,0),passed:true}));
