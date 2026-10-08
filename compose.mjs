import fs from 'node:fs';
import path from 'node:path';

const content=JSON.parse(fs.readFileSync(new URL('./content.json',import.meta.url),'utf8'));
const projects=content.projects;
const origin='https://paco-sanchez-portfolio.noisy-koala-9107.chatgpt.site';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const number=n=>String(n+1).padStart(2,'0');
const favicon="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230a0a0a'/%3E%3Cpath d='M9 24V8h8a6 6 0 0 1 0 12h-4v4zm4-8h4a2 2 0 0 0 0-4h-4z' fill='%23ececec'/%3E%3C/svg%3E";

function document(title,description,route,body){return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0a"><meta name="description" content="${esc(description)}">
<title>${esc(title)}</title><link rel="canonical" href="${origin}${route}">
<link rel="icon" type="image/svg+xml" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css"><script src="/interaction.js" defer></script>
</head><body><a class="skip-link" href="#contenido">Ir al contenido</a>${body}</body></html>`}

function header(home=false){const prefix=home?'':'/';return `<header class="site-header shell">
<a class="identity" href="/" aria-label="Paco Sanchez, inicio">Francisco ‘Paco’ Sanchez<span>Diseñador</span></a>
<nav aria-label="Principal"><a href="${prefix}#proyectos">Proyectos</a><a href="${prefix}#en-paralelo">En paralelo</a><a href="${prefix}#trayectoria">Trayectoria</a><a href="${prefix}#contacto">Contacto</a></nav>
<a class="header-email" href="mailto:fasanchez1998@gmail.com">Email</a></header>`}

function contact(){return `<footer id="contacto" class="contact shell" aria-labelledby="contact-title">
<p class="eyebrow">Contacto</p><div class="contact-main"><h2 id="contact-title">Hablemos.</h2><a class="contact-address text-link" href="mailto:fasanchez1998@gmail.com">fasanchez1998@gmail.com</a></div>
<div class="contact-social"><a class="text-link" href="https://wa.me/541160455838" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="text-link" href="https://www.behance.net/pacosanx" target="_blank" rel="noopener noreferrer">Behance</a></div>
<div class="colophon"><span>Francisco ‘Paco’ Sanchez</span><a href="#" class="text-link">Volver arriba</a></div></footer>`}

function projectRow(p,i){return `<a class="project-row" href="${p.ruta}/" data-project="${i}">
<span class="project-no">${number(i)}</span><div class="project-name"><h3>${esc(p.title)}</h3><p>${esc(p.discipline)}</p></div><span class="project-year">${esc(p.anio)}</span>
<img class="touch-preview" src="${esc(p.preview)}" width="${p.previewWidth}" height="${p.previewHeight}" alt="Vista de ${esc(p.title)}" loading="lazy" decoding="async"></a>`}

function cv(items){return `<ol class="cv-list">${items.map(x=>`<li><span class="cv-date mono">${esc(x.date)}</span><div><h4>${esc(x.title)}</h4><p>${esc(x.context)}</p></div></li>`).join('')}</ol>`}

const home=`${header(true)}<main id="contenido" class="shell">
<section class="opening" aria-labelledby="intro-title"><p class="eyebrow opening-label">Portfolio / 2021–2023</p>
<div class="opening-copy"><h1 id="intro-title">Diseño digital.<br><span>Imagen en movimiento.<br>Interactividad.</span></h1><p>Exploraciones entre imagen, movimiento,<br class="desktop-break"> web y realidad virtual.</p></div>
<a class="opening-index text-link" href="#proyectos">Índice de proyectos <span class="mono">[14]</span></a></section>
<section class="work-section" id="proyectos" aria-labelledby="work-title"><div class="work-heading"><h2 id="work-title">Proyectos</h2><span class="mono muted">01—14</span><p>FADU / UBA<br>2021–2023</p></div>
<div class="work-index">${projects.map(projectRow).join('')}</div>
<aside class="preview-column" aria-hidden="true"><div class="preview-stage"><div class="preview-image-wrap"><img class="preview-image" alt="" decoding="async"></div><div class="preview-caption"><span data-preview-name></span><span class="mono" data-preview-year></span></div><p class="preview-discipline"></p></div></aside></section>
<section id="en-paralelo" class="parallel" aria-labelledby="parallel-title"><h2 class="eyebrow" id="parallel-title">En paralelo</h2>
<article class="datita"><p class="resource-kicker mono">Recursos compartidos</p><h3>Datita digital<br>de Paco.</h3><p>Una colección de herramientas digitales que uso para diseñar, experimentar y compartir con colegas y estudiantes.</p><p class="resource-note">Imagen, código, 3D, movimiento y tipografía.<br>Herramientas ajenas, curiosidad propia.</p><a class="text-link" href="https://datita-digital-de-paco.sanchezfrancis497029.chatgpt.site/" target="_blank" rel="noopener noreferrer">Explorar Datita</a></article>
<article class="lab"><p class="resource-kicker mono">Pruebas gráficas y técnicas</p><h3>Laboratorio.</h3><p>Un espacio para reunir exploraciones fuera de los proyectos.</p><p class="lab-state mono">En preparación</p></article></section>
<section id="trayectoria" class="trajectory" aria-labelledby="trajectory-title"><h2 class="eyebrow" id="trajectory-title">Trayectoria</h2>
<div class="experience"><h3 class="cv-heading">Experiencia</h3>${cv(content.experience)}</div>
<div class="education"><h3 class="cv-heading">Formación</h3>${cv(content.education)}</div></section>
</main>${contact()}`;
fs.writeFileSync('dist/index.html',document('Paco Sanchez — Diseño digital e interactividad','Portfolio de Francisco ‘Paco’ Sanchez. Diseño digital, imagen, movimiento e interactividad.','/',home));

for(const [i,p] of projects.entries()){
  const next=projects[i+1];
  const body=`${header()}<main id="contenido" class="case shell">
  <div class="case-breadcrumb"><a class="text-link" href="/#proyectos">Todos los proyectos</a><span class="mono muted">${number(i)} / 14</span></div>
  <section class="case-intro" aria-labelledby="case-title"><div class="case-reference"><p class="case-year mono">${esc(p.anio)}</p><p class="mono">FADU / UBA</p><p class="case-discipline">${esc(p.discipline)}</p></div>
  <div class="case-title-block"><h1 id="case-title">${esc(p.title)}</h1><p class="case-description">${esc(p.descripcion)}</p></div>
  <div class="case-tools"><h2 class="eyebrow">Herramientas</h2><ul>${p.tools.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><a class="text-link case-source" href="${esc(p.fuente)}" target="_blank" rel="noopener noreferrer">${p.fuente.includes('youtu')?'Ver en YouTube':'Ver en Behance'}</a></div></section>
  <div class="case-gallery">${p.imagenes.map((image,j)=>`<figure class="case-figure" style="max-width:${Math.min(1120,image.width)}px;margin-inline:auto"><img src="${esc(image.url)}" width="${image.width}" height="${image.height}" alt="${esc(p.title)}, imagen ${j+1}" ${j?'loading="lazy"':'fetchpriority="high"'} decoding="async"></figure>`).join('')}</div>
  <nav class="case-pagination" aria-label="Navegación entre proyectos"><a class="text-link" href="/#proyectos">Volver al índice</a><a class="next-project" href="${next?next.ruta+'/':'/#proyectos'}"><span class="eyebrow">${next?'Siguiente proyecto':'Fin del índice'}</span><span>${next?esc(next.title):'Volver a proyectos'}</span></a></nav>
  </main>${contact()}`;
  const routeDir=path.join('dist',p.ruta);fs.mkdirSync(routeDir,{recursive:true});
  fs.writeFileSync(path.join(routeDir,'index.html'),document(`${p.title} — Paco Sanchez`,p.descripcion,p.ruta+'/',body));
}

const previewData=projects.map(p=>({name:p.title,year:p.anio,discipline:p.discipline,src:p.preview}));
fs.writeFileSync('dist/preview-data.json',JSON.stringify(previewData));
console.log(JSON.stringify({pages:projects.length+1,projects:projects.length,galleryImages:projects.reduce((n,p)=>n+p.imagenes.length,0)}));
