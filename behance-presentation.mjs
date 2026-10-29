const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const source=block=>block.sourceModule?` data-source-module="${esc(block.sourceModule)}"`:'';

// Keep authored modules in sequence; blank text modules are part of the composition.
export function renderBehanceModules(project,{embedded=false}={}){
  let imageIndex=0;
  const image=block=>{
    const alt=block.alt||`${project.title}, estudio visual ${imageIndex+1}`;imageIndex++;
    return `<figure class="case-figure"${source(block)}><a class="case-zoom" href="${esc(block.url)}" data-image-viewer-trigger aria-label="Ampliar: ${esc(alt)}"><img src="${esc(block.url)}" width="${Number(block.width)}" height="${Number(block.height)}" alt="${esc(alt)}" loading="lazy" decoding="async"></a></figure>`;
  };
  return project.blocks.map(block=>{
    if(block.type==='text'){
      const tag=embedded?'h3':'h2';
      let text=esc(block.text||'');
      for(const word of block.emphasis||[])text=text.replace(esc(word),`<em>${esc(word)}</em>`);
      const extra=[];
      for(const link of block.links||[]){
        const label=esc(link.text),anchor=`<a href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${label}</a>${link.suffix?` ${esc(link.suffix)}`:''}`;
        if(text.includes(label))text=text.replace(label,anchor);else extra.push(anchor);
      }
      const paragraphs=text?text.split(/\n\s*\n/).map(paragraph=>`<p>${paragraph.replaceAll('\n','<br>')}</p>`).join(''):'';
      return `<section class="behance-copy${block.heading?' behance-section-heading':''}"${source(block)} style="--blank-lines:${Number(block.spaceBefore)||0}">${block.heading?`<${tag}>${esc(block.heading)}</${tag}>`:''}${paragraphs}${extra.length?`<p class="behance-links">${extra.join('<br>')}</p>`:''}</section>`;
    }
    if(block.type==='spacer')return `<div class="behance-spacer"${source(block)} style="--blank-lines:${Number(block.lines)||0}" aria-hidden="true"></div>`;
    if(block.type==='image')return image(block);
    if(block.type==='embed')return `<figure class="case-embed behance-embed"${source(block)} style="--embed-width:${Number(block.maxWidth)||1400}px"><div class="case-player" style="--media-ratio:${Number(block.aspectRatio)||16/9}"><iframe src="${esc(block.url)}" title="${esc(block.title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></figure>`;
    if(block.type==='gallery'&&block.layout==='behance-mosaic'){
      let offset=0;
      const rows=block.rowLengths.map(length=>{
        const images=block.images.slice(offset,offset+length);offset+=length;
        return `<div class="behance-mosaic-row" style="grid-template-columns:${images.map(item=>`${Number(item.width)/Number(item.height)}fr`).join(' ')}">${images.map(image).join('')}</div>`;
      }).join('');
      return `<div class="behance-mosaic${block.inset?' behance-inset':''}"${source(block)} aria-label="${esc(block.label||`Estudios animados de ${project.title.toUpperCase()}`)}">${rows}</div>`;
    }
    throw new Error(`Módulo original sin soporte: ${block.type}`);
  }).join('');
}

