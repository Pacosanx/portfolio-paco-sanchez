import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const heroRevision=createHash('sha256').update(fs.readFileSync(new URL('./dist/hero.css',import.meta.url))).update(fs.readFileSync(new URL('./dist/hero.js',import.meta.url))).digest('hex').slice(0,12);
import { parallelSection } from './parallel.mjs';
import { projectFilters, projectCategories } from './filters.mjs';

const content=JSON.parse(fs.readFileSync(new URL('./content.json',import.meta.url),'utf8'));
const projects=content.projects.filter(p=>!['/proyectos/algo-esta-mutando','/proyectos/editorial-tipografico-2021'].includes(p.ruta));
const projectCount=projects.length;
const years=projects.map(p=>Number(p.anio)).filter(Number.isFinite);
const period=[Math.min(...years),Math.max(...years)].join('–');
const teaching=JSON.parse(fs.readFileSync(new URL('./teaching.json',import.meta.url),'utf8'));
const selections=JSON.parse(fs.readFileSync(new URL('./preview-selection.json',import.meta.url),'utf8'));
const basePath=(process.env.SITE_BASE_PATH||'').replace(/\/+$/,'');
const sitePath=route=>`${basePath}${route}`;
const versionedAsset=(route,source)=>sitePath(route)+'?v='+createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0,10);
const assetPath=url=>url.startsWith('/')&&!url.startsWith('//')?sitePath(url):url;
const origin=(process.env.SITE_ORIGIN||'https://paco-sanchez-portfolio.noisy-koala-9107.chatgpt.site').replace(/\/+$/,'');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const number=n=>String(n+1).padStart(2,'0');
const favicon="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230a0a0a'/%3E%3Cpath d='M9 24V8h8a6 6 0 0 1 0 12h-4v4zm4-8h4a2 2 0 0 0 0-4h-4z' fill='%23ececec'/%3E%3C/svg%3E";

function document(title,description,route,body){return `<!doctype html>
<html lang="es" data-base-path="${basePath}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0a"><meta name="description" content="${esc(description)}">
<title>${esc(title)}</title><link rel="canonical" href="${origin}${sitePath(route)}">
<link rel="icon" type="image/svg+xml" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${sitePath('/styles.css')}"><link rel="stylesheet" href="${sitePath('/parallel.css')}"><link rel="stylesheet" href="${sitePath('/trajectory.css')}"><link rel="stylesheet" href="${sitePath('/project-previews.css')}"><link rel="stylesheet" href="${versionedAsset('/case-content.css','dist/case-content.css')}"><link rel="stylesheet" href="${sitePath('/project-filters.css')}"><link rel="stylesheet" href="${sitePath('/editorial-grid.css')}">${route==='/'?`<link rel="stylesheet" href="${sitePath('/hero.css')}?v=${heroRevision}">`:''}<script src="${sitePath('/project-filters.js')}" defer></script><script src="${sitePath('/interaction.js')}" defer></script><script src="${sitePath('/project-previews.js')}" defer></script>${route==='/'||route.replace(/\/+$/,'')==='/proyectos/instalacion-vr'?`<script src="${versionedAsset('/assets/inmson-drawing.js','assets/inmson-drawing.js')}" defer></script>`:''}
</head><body><a class="skip-link" href="#contenido">Ir al contenido</a>${body}</body></html>`}

function header(home=false){const prefix=home?'':sitePath('/');return `<header class="site-header shell">
<a class="identity" href="${sitePath('/')}" aria-label="Paco Sanchez, inicio">Francisco ‘Paco’ Sanchez<span>Diseñador</span></a>
<nav aria-label="Principal"><a href="${prefix}#proyectos">Proyectos</a><a href="${prefix}#en-paralelo">En paralelo</a><a href="${prefix}#trayectoria">Trayectoria</a><a href="${prefix}#contacto">Contacto</a></nav>
<a class="header-email" href="mailto:fasanchez1998@gmail.com">Email</a></header>`}

function contact(){return `<footer id="contacto" class="contact shell" aria-labelledby="contact-title">
<p class="eyebrow">Contacto</p><div class="contact-main"><h2 id="contact-title">Hablemos.</h2><a class="contact-address text-link" href="mailto:fasanchez1998@gmail.com">fasanchez1998@gmail.com</a></div>
<div class="contact-social"><a class="text-link" href="https://www.behance.net/pacosanx" target="_blank" rel="noopener noreferrer">Behance</a></div>
<div class="colophon"><span>Francisco ‘Paco’ Sanchez</span><a href="#" class="text-link">Volver arriba</a></div></footer>`}

function projectRow(p,i){return `<a class="project-row" href="${sitePath(p.ruta)}/" data-project="${i}" data-categories="${projectCategories(p).join(' ')}" data-programs="${esc(p.tools.join(' '))}" ${i>=15?'data-overflow hidden':''}>
<span class="project-no">${number(i)}</span><div class="project-name"><h3>${esc(p.title)}</h3></div><span class="project-year">${esc(p.anio)}</span></a>`}

function cv(items,label){return `<table class="cv-table" aria-label="${label}"><colgroup><col><col><col></colgroup><thead class="sr-only"><tr><th scope="col">Período</th><th scope="col">Actividad</th><th scope="col">Detalle</th></tr></thead><tbody>${items.map(x=>`<tr><td class="cv-date mono">${esc(x.date)}</td><th class="cv-role" scope="row">${esc(x.title)}</th><td class="cv-context">${esc(x.context)}</td></tr>`).join('')}</tbody></table>`}

function caseImage(image,p,j){return `<figure class="case-figure" style="max-width:${Math.min(1120,image.width||1120)}px;margin-inline:auto"><img src="${esc(assetPath(image.url))}" ${image.srcset?`srcset="${esc(image.srcset)}" sizes="(max-width:600px) calc(100vw - 48px), (max-width:1300px) 80vw, 1120px"`:''} ${image.width?`width="${image.width}"`:''} ${image.height?`height="${image.height}"`:''} alt="${esc(image.alt||`${p.title}, imagen ${j+1}`)}" ${j?'loading="lazy"':'fetchpriority="high"'} decoding="async">${image.caption?`<figcaption>${esc(image.caption)}</figcaption>`:''}</figure>`}
function caseText(block){
  const text=String(block.text||'').trim().replace(/\n{3,}/g,'\n\n');
  let linked=esc(text);
  const extra=[];
  for(const link of block.links||[]){
    if(!/^https?:\/\//.test(link.href))continue;
    const label=esc(link.text||link.href),anchor=`<a class="text-link" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    if(linked.includes(label))linked=linked.replace(label,anchor);else extra.push(anchor);
  }
  const lines=linked.split('\n');
  const heading=text.split('\n')[0];
  const isHeading=heading.length<80&&/[A-ZÁÉÍÓÚÑ]/.test(heading)&&heading===heading.toUpperCase();
  return `<div class="case-text">${isHeading?`<h3>${lines.shift()}</h3>`:''}${lines.length?`<p>${lines.join('<br>')}</p>`:''}${extra.length?`<p class="case-text-links">${extra.join('<br>')}</p>`:''}</div>`;
}
function caseDescription(p){
  let text=esc(p.descripcion).replaceAll('\n','<br>');
  for(const link of p.links||[]){
    if(!/^https?:\/\//.test(link.href))continue;
    const label=esc(link.text||link.href),anchor=`<a class="text-link" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    const match=text.includes(esc(link.href))?esc(link.href):label;
    text=text.includes(match)?text.replace(match,anchor):text+'<br>'+anchor;
  }
  return text;
}
function caseGallery(p){
  let imageIndex=0;
  const blocks=p.blocks?.length?p.blocks:p.imagenes.map(image=>({type:'image',...image}));
  return blocks.map(block=>{
    if(block.type==='image')return caseImage(block,p,imageIndex++);
    if(block.type==='gallery')return `<div class="case-image-group">${block.images.map(image=>caseImage(image,p,imageIndex++)).join('')}</div>`;
    if(block.type==='text')return caseText(block);
    if(block.type==='embed'){
      const ratio=Number(block.aspectRatio)>0?Number(block.aspectRatio):16/9;
      return `<figure class="case-embed${ratio<1?' is-portrait':''}" style="--media-ratio:${ratio}"><div class="case-player"><iframe src="${esc(assetPath(block.url))}" title="${esc(block.title||p.title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>${block.link?`<figcaption><a class="text-link" href="${esc(block.link)}" target="_blank" rel="noopener noreferrer">${esc(block.title||'Ver video en YouTube')}</a></figcaption>`:''}</figure>`;
    }
    if(block.type==='video')return `<figure class="case-video"><video src="${esc(assetPath(block.url))}" ${block.poster?`poster="${esc(assetPath(block.poster))}"`:''} controls playsinline preload="metadata" aria-label="${esc(block.title||p.title)}"></video>${block.caption?`<figcaption>${esc(block.caption)}</figcaption>`:''}</figure>`;
    if(block.type==='interactive')return `<section class="inmson-case-interaction" aria-labelledby="inmson-interaction-title"><div class="case-text inmson-interaction-intro"><h3 id="inmson-interaction-title">02 / PROBALO ACÁ</h3><p>${esc(block.title)}<br>${esc(block.description)}</p></div><inmson-drawing></inmson-drawing>${block.caption?`<p class="interaction-caption">${esc(block.caption)}</p>`:''}</section>`;
    return '';
  }).join('');
}

function caseContent(p,i,embedded=false){
  const next=projects[i+1],titleTag=embedded?'h2':'h1',toolsTag=embedded?'h3':'h2',titleId=embedded?'viewer-title':'case-title';
  return `<section class="case-intro" aria-labelledby="${titleId}"><div class="case-reference"><p class="case-year mono">${esc(p.anio)}</p>${(p.context??'FADU / UBA')?`<p class="mono">${esc(p.context??'FADU / UBA')}</p>`:''}<p class="case-discipline">${esc(p.discipline)}</p>${p.status?`<p class="project-status">${esc(p.status)}</p>`:''}</div>
  <div class="case-title-block"><${titleTag} id="${titleId}" tabindex="-1">${esc(p.title)}</${titleTag}>${p.descripcion?`<p class="case-description">${caseDescription(p)}</p>`:''}</div>
  <div class="case-tools">${p.tools.length?`<${toolsTag} class="eyebrow">Herramientas</${toolsTag}><ul>${p.tools.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}<a class="text-link case-source" href="${esc(assetPath(p.fuente))}" target="_blank" rel="noopener noreferrer">${esc(p.fuenteLabel||(p.fuente.includes('youtu')?'Ver en YouTube':p.fuente.includes('myportfolio.com')?'Ver en Adobe Portfolio':'Ver en Behance'))}</a></div></section>
  <div class="case-gallery${p.galleryLayout==='grid'?' case-gallery-grid':''}">${caseGallery(p)}</div>
  <nav class="case-pagination" aria-label="Navegación entre proyectos"><a class="text-link" href="${sitePath('/')}#proyectos" ${embedded?'data-close-project':''}>Volver al índice</a><a class="next-project" href="${next?sitePath(next.ruta)+'/':sitePath('/#proyectos')}" ${embedded&&!next?'data-close-project':''}><span class="eyebrow">${next?'Siguiente proyecto':'Fin del índice'}</span><span>${next?esc(next.title):'Volver a proyectos'}</span></a></nav>`;
}

const viewer=`<dialog id="project-viewer" class="project-viewer" aria-labelledby="viewer-title">
<div class="viewer-toolbar shell"><button class="text-link" type="button" data-close-project autofocus>Volver al índice</button><span class="mono muted" data-viewer-index></span></div>
<div class="viewer-content case shell" data-viewer-content></div></dialog>
${projects.map((p,i)=>`<template data-project-template data-project-route="${sitePath(p.ruta)}/" data-project-slug="${p.ruta.split('/').filter(Boolean).at(-1)}" data-project-title="${esc(p.title)}" data-project-index="${i}">${caseContent(p,i,true)}</template>`).join('')}`;

const home=`${header(true)}<main id="contenido" class="shell">
<section class="opening" aria-labelledby="intro-title"><div class="opening-atmosphere" aria-hidden="true"><canvas class="opening-shader"></canvas></div><script src="${sitePath('/hero.js')}?v=${heroRevision}" defer></script><p class="eyebrow opening-label">Portfolio / ${period}</p>
<div class="opening-copy"><h1 id="intro-title">Experimento con tecnología.<br><span>Diseño experiencias digitales<br>e interactivas.</span></h1></div><p class="opening-lead">Exploro la vanguardia digital a través de la web, los entornos inmersivos y la imagen en movimiento.</p><a class="opening-cue mono" href="#proyectos">Deslizá para explorar</a>
</section>
<section class="work-section" id="proyectos" aria-labelledby="work-title"><div class="work-heading"><h2 id="work-title">Proyectos</h2><span class="mono muted">01—${String(projectCount).padStart(2,'0')}</span>${projectFilters(projects)}</div>
<div class="work-index" id="project-index">${projects.map(projectRow).join('')}<p class="project-empty" data-project-empty hidden>No hay proyectos con esta combinación.<br>Probá otro programa o cambiá el área.</p><button class="index-more" type="button" data-project-more aria-expanded="false" aria-controls="project-index">Ver ${Math.max(0,projectCount-15)} proyectos más</button><noscript><style>.project-row[hidden]{display:grid}.index-more{display:none}</style></noscript></div>
<aside class="preview-column" aria-hidden="true"><div class="preview-stage"><div class="preview-image-wrap"></div></div></aside></section>
${parallelSection(sitePath)}
<section id="trayectoria" class="trajectory" aria-labelledby="trajectory-title"><h2 class="eyebrow" id="trajectory-title">Trayectoria</h2>
<div class="experience"><h3 class="cv-heading">Experiencia</h3>${cv([...teaching,...content.experience],'Experiencia')}</div>
<div class="education"><h3 class="cv-heading">Formación</h3>${cv(content.education,'Formación')}</div></section>
</main>${contact()}${viewer}`;
fs.writeFileSync('dist/index.html',document('Paco Sanchez — Diseño digital e interactividad','Portfolio de Francisco ‘Paco’ Sanchez. Experimentación con tecnología, diseño digital e interactividad.','/',home));

for(const [i,p] of projects.entries()){
  const body=`${header()}<main id="contenido" class="case shell">
  <div class="case-breadcrumb"><a class="text-link" href="${sitePath('/')}#proyectos">Todos los proyectos</a><span class="mono muted">${number(i)} / ${projectCount}</span></div>
  ${caseContent(p,i)}
  </main>${contact()}`;
  const routeDir=path.join('dist',p.ruta);fs.mkdirSync(routeDir,{recursive:true});
  fs.writeFileSync(path.join(routeDir,'index.html'),document(`${p.title} — Paco Sanchez`,p.descripcion,p.ruta+'/',body));
}

const previewData=projects.map(p=>({route:p.ruta,images:(selections[p.ruta]||[]).map(image=>({...image,src:assetPath(image.src)}))}));
fs.writeFileSync('dist/preview-data.json',JSON.stringify(previewData));
fs.mkdirSync('dist/assets',{recursive:true});
for(const asset of ['inmson-drawing.js','inmson-recorrido.jpg','inmson-recorrido-vr.mp4','inmson-afiche-original.jpg']){
  fs.copyFileSync(path.join('assets',asset),path.join('dist/assets',asset));
}
console.log(JSON.stringify({pages:projects.length+1,projects:projects.length,galleryImages:projects.reduce((n,p)=>n+p.imagenes.length,0)}));

