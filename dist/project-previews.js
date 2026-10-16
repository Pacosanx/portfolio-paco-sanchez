(() => {
  const index = document.querySelector('.work-index');
  const stage = document.querySelector('.preview-stage');
  const wrap = stage?.querySelector('.preview-image-wrap');
  const column = document.querySelector('.preview-column');
  if (!index || !stage || !wrap || !column) return;
  const rows = [...index.querySelectorAll('.project-row')];
  const desktop = window.matchMedia('(min-width:1001px)');
  const cache = new Map();
  let records = [], selected = -1, request = 0, keyboardFocus = false, frame;
  const arrangements = {
    metaphex: 'right', 'maradona-alien': 'left', 'instalacion-vr': 'fan',
    'esquematica-microevento': 'poster', 'editorial-espacial': 'right',
    'editorial-registros': 'fan', 'editorial-tipografico-2023': 'left',
    'motion-graphics': 'right', 'filtros-instagram': 'poster',
    'sistema-grafico': 'poster', 'afiche-y-brochure': 'fan',
    'historias-instagram': 'poster', 'web-arquitectura': 'right',
    'cuando-acecha-la-maldad-afiche-cine': 'left', 'fanzine-dg2-gabriele': 'poster',
    'festival-sistema-grafico-v1': 'fan', 'festival-sistema-grafico': 'poster',
    'video-cinetica-dg2-gabriele': 'left',
    'lenguajes-visuales-tp2-dg1-catedra-gabriele': 'fan',
    'demo-youtube-darksidesports': 'right', 'pirana-modelado-3d': 'fan',
    'vr-medios-groisman-2': 'left'
  };

  const load = asset => {
    if (cache.has(asset.src)) return { ...cache.get(asset.src), asset };
    const image = new Image();
    image.alt = '';
    image.decoding = 'async';
    const entry = { image };
    entry.promise = new Promise((resolve, reject) => {
      image.onload = async () => {
        try { await image.decode(); } catch { /* Loaded source remains usable. */ }
        image.naturalWidth ? resolve(entry) : reject(new Error('Empty preview'));
      };
      image.onerror = () => reject(new Error('Preview unavailable'));
    });
    cache.set(asset.src, entry);
    image.src = asset.src;
    return { ...entry, asset };
  };

  const createCard = entry => {
    const { asset } = entry;
    const raw = asset.crop || { x: 0, y: 0, width: 1, height: 1 };
    const crop = {
      x: Math.max(0, Math.min(.99, Number(raw.x) || 0)),
      y: Math.max(0, Math.min(.99, Number(raw.y) || 0)),
      width: Math.max(.01, Math.min(1, Number(raw.width) || 1)),
      height: Math.max(.01, Math.min(1, Number(raw.height) || 1))
    };
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.dataset.role = asset.role || 'detail';
    card.dataset.ratio = asset.width * crop.width / (asset.height * crop.height);
    const cropFrame = document.createElement('div');
    cropFrame.className = 'preview-crop';
    const image = entry.image.cloneNode(true);
    image.className = 'preview-image';
    image.style.width = `${100 / crop.width}%`;
    image.style.height = `${100 / crop.height}%`;
    image.style.left = `${-100 * crop.x / crop.width}%`;
    image.style.top = `${-100 * crop.y / crop.height}%`;
    if (/^(polygon|inset)\([\d\s.,%+-]+\)$/.test(asset.clipPath || '')) image.style.clipPath = asset.clipPath;
    cropFrame.append(image);
    card.append(cropFrame);
    return { card, image };
  };

  const position = () => {
    if (selected < 0 || !desktop.matches) return false;
    const section = column.closest('.work-section')?.getBoundingClientRect();
    if (!section || section.bottom <= 0 || section.top >= innerHeight || rows[selected].hidden) return false;
    const box = column.getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(column).paddingLeft) || 0;
    const width = Math.max(0, box.width - padding);
    if (!width) return false;
    const height = Math.min(width * 1.18, innerHeight - 40, section.height);
    const centeredTop = (innerHeight - height) / 2;
    const sectionTop = Math.min(section.bottom - height, Math.max(section.top, centeredTop));
    stage.style.left = `${box.left + padding}px`;
    stage.style.width = `${width}px`;
    stage.style.top = `${sectionTop}px`;
    wrap.style.height = `${height}px`;
    [...wrap.children].forEach((card, i) => {
      const ratio = Number(card.dataset.ratio) || 1;
      const whole = card.dataset.role === 'whole';
      const layout = wrap.dataset.layout;
      const mainWidth = layout === 'fan' ? .88 : layout === 'poster' ? .76 : .91;
      const maxWidth = width * (whole ? mainWidth : i === 1 ? .65 : .61);
      const maxHeight = height * (whole ? (ratio < 1 ? .82 : .68) : i === 1 ? .49 : .45);
      const cardWidth = Math.min(maxWidth, maxHeight * ratio);
      card.style.width = `${cardWidth}px`;
      card.style.height = `${cardWidth / ratio}px`;
    });
    return true;
  };

  const hide = () => {
    ++request;
    selected = -1;
    stage.classList.remove('is-visible');
    rows.forEach(row => row.classList.remove('is-active'));
  };
  const show = async i => {
    selected = i;
    if (!desktop.matches || !records.length) return;
    const token = ++request;
    const slug = records[i]?.route?.split('/').filter(Boolean).pop();
    wrap.dataset.layout = arrangements[slug] || 'fan';
    // A small, stable tilt change keeps related projects from sharing one stack.
    const seed = [...(slug || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    wrap.style.setProperty('--preview-tilt', `${(seed % 5) - 2}deg`);
    rows.forEach((row, j) => row.classList.toggle('is-active', i === j));
    stage.classList.remove('is-visible');
    position();
    const assets = (records[i]?.images || []).filter(a => a.src && a.width > 0 && a.height > 0).slice(0, 3);
    if (assets.length < 3) { wrap.replaceChildren(); return; }
    const current = () => token === request && selected === i && desktop.matches;
    try {
      const entries = assets.map(load);
      await Promise.all(entries.map(entry => entry.promise));
      if (!current()) return;
      const cards = entries.map(createCard);
      await Promise.all(cards.map(({ image }) => image.decode()));
      if (!current()) return;
      wrap.replaceChildren(...cards.map(({ card }) => card));
      wrap.dataset.projectIndex = i;
      stage.classList.toggle('is-visible', position());
    } catch { if (current()) wrap.replaceChildren(); }
  };

  const focusedIndex = () => rows.findIndex(row => row.contains(document.activeElement));
  document.addEventListener('keydown', () => { keyboardFocus = true; }, true);
  index.addEventListener('pointermove', event => {
    keyboardFocus = false;
    const i = rows.indexOf(event.target.closest('.project-row'));
    if (i >= 0 && selected !== i) show(i);
  });
  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', () => { if (!keyboardFocus || focusedIndex() < 0) show(i); });
    row.addEventListener('focusin', event => { if (event.isTrusted) show(i); });
    row.addEventListener('focusout', () => queueMicrotask(() => { if (focusedIndex() < 0) hide(); }));
  });
  index.addEventListener('pointerleave', () => { const i = focusedIndex(); i < 0 ? hide() : show(i); });
  const reposition = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      stage.classList.toggle('is-visible', Number(wrap.dataset.projectIndex) === selected && wrap.childElementCount === 3 && position());
    });
  };
  window.addEventListener('scroll', reposition, { passive: true });
  window.addEventListener('resize', reposition);
  document.addEventListener('portfolio:filter', hide);
  document.addEventListener('portfolio:reveal', hide);
  desktop.addEventListener('change', () => { hide(); if (desktop.matches && focusedIndex() >= 0) show(focusedIndex()); });
  const basePath = document.documentElement.dataset.basePath || '';
  fetch(`${basePath}/preview-data.json`, { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('Previews unavailable'); return response.json(); })
    .then(data => {
      records = rows.map(row => data.find(record => new URL(row.href, location.href).pathname.replace(/\/$/, '') === `${basePath}${record.route}`.replace(/\/$/, '')));
      if (selected >= 0) show(selected);
    }).catch(hide);
})();
