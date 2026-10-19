(() => {
  const index = document.querySelector('.work-index');
  const stage = document.querySelector('.preview-stage');
  const wrap = stage?.querySelector('.preview-image-wrap');
  const column = document.querySelector('.preview-column');
  if (!index || !stage || !wrap || !column) return;
  const rows = [...index.querySelectorAll('.project-row')];
  const desktop = window.matchMedia('(min-width:1001px)');
  const cache = new Map();
  let records = [], selected = -1, request = 0, keyboardFocus = false, previewSuppressed = false, frame;
  const arrangements = {
    metaphex: 'figma', 'maradona-alien': 'figma', nexo: 'figma', 'instalacion-vr': 'figma',
    'esquematica-microevento': 'figma', 'editorial-espacial': 'figma',
    'editorial-registros': 'fan', 'editorial-tipografico-2023': 'figma',
    'motion-graphics': 'figma', 'filtros-instagram': 'figma',
    'sistema-grafico': 'figma', 'afiche-y-brochure': 'figma',
    'historias-instagram': 'figma', 'web-arquitectura': 'figma',
    'cuando-acecha-la-maldad-afiche-cine': 'figma', 'fanzine-dg2-gabriele': 'figma',
    'festival-sistema-grafico-v1': 'figma', 'festival-sistema-grafico': 'figma',
    'video-cinetica-dg2-gabriele': 'figma',
    'lenguajes-visuales-tp2-dg1-catedra-gabriele': 'figma',
    'demo-youtube-darksidesports': 'figma', 'pirana-modelado-3d': 'fan',
    'vr-medios-groisman-2': 'figma'
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
    const card = document.createElement('div');
    card.className = asset.mockup === 'phone' ? 'preview-card is-phone-mockup' : 'preview-card';
    if (asset.screenInset) card.style.setProperty('--phone-screen-inset', asset.screenInset);
    card.dataset.role = asset.role || 'detail';
    card.style.transition = 'transform 220ms cubic-bezier(.2,.7,.2,1)';
    card.style.willChange = 'transform';
    const geometry = asset.geometry;
    card.dataset.ratio = geometry?.width && geometry?.height
      ? geometry.width / geometry.height
      : asset.width / asset.height;
    const cropFrame = document.createElement('div');
    cropFrame.className = 'preview-crop';
    const sources = entry.layers?.length ? entry.layers : [entry];
    const images = sources.map(source => {
      const sourceAsset = source.asset || asset;
      const raw = sourceAsset.crop || (!source.asset ? asset.crop : null) || { x: 0, y: 0, width: 1, height: 1 };
      const crop = {
        x: Math.max(0, Math.min(.99, Number(raw.x) || 0)),
        y: Math.max(0, Math.min(.99, Number(raw.y) || 0)),
        width: Math.max(.01, Math.min(1, Number(raw.width) || 1)),
        height: Math.max(.01, Math.min(1, Number(raw.height) || 1))
      };
      const image = source.image.cloneNode(true);
      image.className = 'preview-image';
      image.style.width = `${100 / crop.width}%`;
      image.style.height = `${100 / crop.height}%`;
      image.style.left = `${-100 * crop.x / crop.width}%`;
      image.style.top = `${-100 * crop.y / crop.height}%`;
      if (/^(polygon|inset)\([\d\s.,%+-]+\)$/.test(sourceAsset.clipPath || '')) image.style.clipPath = sourceAsset.clipPath;
      cropFrame.append(image);
      return image;
    });
    card.append(cropFrame);
    return { card, images };
  };

  const position = () => {
    if (selected < 0 || !desktop.matches) return false;
    const section = column.closest('.work-section')?.getBoundingClientRect();
    if (!section || section.bottom <= 0 || section.top >= innerHeight || rows[selected].hidden) return false;
    const layout = wrap.dataset.layout;
    if (layout === 'figma') {
      const images = records[selected]?.images || [];
      const bounds = images.reduce((result, image) => {
        const geometry = image.geometry;
        if (!geometry) return result;
        const angle = (Number(geometry.rotation) || 0) * Math.PI / 180;
        const rotatedWidth = Math.abs(Number(geometry.width) * Math.cos(angle))
          + Math.abs(Number(geometry.height) * Math.sin(angle));
        const rotatedHeight = Math.abs(Number(geometry.width) * Math.sin(angle))
          + Math.abs(Number(geometry.height) * Math.cos(angle));
        const centerX = Number(geometry.x) + Number(geometry.width) / 2;
        const centerY = Number(geometry.y) + Number(geometry.height) / 2;
        return {
          left: Math.min(result.left, centerX - rotatedWidth / 2),
          right: Math.max(result.right, centerX + rotatedWidth / 2),
          top: Math.min(result.top, centerY - rotatedHeight / 2),
          bottom: Math.max(result.bottom, centerY + rotatedHeight / 2)
        };
      }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
      const groupWidth = bounds.right - bounds.left;
      const groupHeight = bounds.bottom - bounds.top;
      const hasBounds = Number.isFinite(bounds.left) && Number.isFinite(bounds.right)
        && Number.isFinite(bounds.top) && Number.isFinite(bounds.bottom)
        && groupWidth > 0 && groupHeight > 0;
      const tableRight = index.getBoundingClientRect().right;
      const safeInset = 12;
      const areaLeft = Math.max(safeInset, tableRight + safeInset);
      const areaRight = innerWidth - safeInset;
      const areaTop = Math.max(safeInset, section.top + safeInset);
      const areaBottom = Math.min(innerHeight - safeInset, section.bottom - safeInset);
      const areaWidth = areaRight - areaLeft;
      const areaHeight = areaBottom - areaTop;
      // Only show the group when there is enough visible section area to keep every card on-screen.
      if (hasBounds && (areaWidth < 80 || areaHeight < 96)) return false;
      const frameScale = Math.min(innerWidth / 1919, innerHeight / 905);
      const scale = hasBounds
        ? Math.min(frameScale, areaWidth / groupWidth, areaHeight / groupHeight)
        : frameScale;
      const horizontalShift = hasBounds
        ? (areaLeft + areaRight) / 2 - (bounds.left + bounds.right) * scale / 2
        : (innerWidth - 1919 * scale) / 2;
      const projectVerticalOffset = wrap.dataset.project === 'festival-sistema-grafico-v1' ? 24 * frameScale : 0;
      const verticalShift = hasBounds
        ? (areaTop + areaBottom) / 2 - (bounds.top + bounds.bottom) * scale / 2 + projectVerticalOffset
        : (innerHeight - 905 * scale) / 2;
      stage.style.left = '0px';
      stage.style.width = `${innerWidth}px`;
      stage.style.top = '0px';
      stage.style.height = `${innerHeight}px`;
      wrap.style.width = `${innerWidth}px`;
      wrap.style.height = `${innerHeight}px`;
      wrap.style.maxHeight = 'none';
      [...wrap.children].forEach((card, i) => {
        const geometry = images[i]?.geometry;
        if (!geometry) return;
        // Figma geometry replaces the card's initial centered transform; don't animate that repositioning.
        card.style.transition = 'none';
        card.style.setProperty('left', `${horizontalShift + Number(geometry.x) * scale}px`, 'important');
        card.style.setProperty('top', `${verticalShift + Number(geometry.y) * scale}px`, 'important');
        card.style.setProperty('right', 'auto', 'important');
        card.style.setProperty('bottom', 'auto', 'important');
        card.style.setProperty('width', `${Number(geometry.width) * scale}px`, 'important');
        card.style.setProperty('height', `${Number(geometry.height) * scale}px`, 'important');
        card.style.setProperty('transform', `rotate(${Number(geometry.rotation) || 0}deg)`, 'important');
        card.style.setProperty('transform-origin', 'center', 'important');
        card.style.setProperty('z-index', String(Number(geometry.zIndex) || i + 1), 'important');
      });
      return true;
    }
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
    wrap.style.width = `${width}px`;
    wrap.style.height = `${height}px`;
    [...wrap.children].forEach(card => {
      const ratio = Number(card.dataset.ratio) || 1;
      const whole = card.dataset.role === 'whole';
      const count = wrap.children.length;
      const mainWidth = count > 5 ? .4 : count > 3 ? .48 : .74;
      const detailWidth = count > 5 ? .24 : count > 3 ? .32 : .48;
      const maxWidth = width * (whole ? mainWidth : detailWidth);
      const maxHeight = height * (whole ? (count > 5 ? .45 : count > 3 ? .56 : ratio < 1 ? .78 : .64) : count > 5 ? .28 : count > 3 ? .34 : .44);
      const cardWidth = Math.min(maxWidth, maxHeight * ratio);
      card.style.width = `${cardWidth}px`;
      card.style.height = `${cardWidth / ratio}px`;
    });
    // Center the complete legacy composition between the project table and viewport edge.
    // The cards use asymmetric percentage anchors, so centering the stage alone is not enough.
    const cards = [...wrap.children];
    const group = cards.reduce((bounds, card) => {
      const rect = card.getBoundingClientRect();
      return {
        left: Math.min(bounds.left, rect.left),
        right: Math.max(bounds.right, rect.right)
      };
    }, { left: Infinity, right: -Infinity });
    if (Number.isFinite(group.left) && Number.isFinite(group.right)) {
      const tableRight = index.getBoundingClientRect().right;
      const targetCenter = (tableRight + innerWidth) / 2;
      const groupCenter = (group.left + group.right) / 2;
      stage.style.left = `${box.left + padding + targetCenter - groupCenter}px`;
    }
    return true;
  };

  const hide = () => {
    ++request;
    selected = -1;
    stage.classList.remove('is-visible', 'is-changing');
    rows.forEach(row => row.classList.remove('is-active'));
  };
  const show = async i => {
    selected = i;
    if (!desktop.matches || !records.length) return;
    const token = ++request;
    const hadPreview = stage.classList.contains('is-visible') && wrap.childElementCount > 0;
    const slug = records[i]?.route?.split('/').filter(Boolean).pop();
    rows.forEach((row, j) => row.classList.toggle('is-active', i === j));
    if (hadPreview) stage.classList.add('is-changing');
    else stage.classList.remove('is-visible', 'is-changing');
    const assets = (records[i]?.images || []).filter(a => a.src && a.width > 0 && a.height > 0).slice(0, 12);
    if (!assets.length) { wrap.dataset.previewCount = '0'; wrap.replaceChildren(); stage.classList.remove('is-changing', 'is-visible'); return; }
    const current = () => token === request && selected === i && desktop.matches;
    try {
      const entries = assets.map(asset => {
        const main = load(asset);
        const layers = (asset.layers || []).map(load);
        return { asset, image: main.image, promise: main.promise, layers };
      });
      await Promise.all(entries.flatMap(entry => [entry.promise, ...entry.layers.map(layer => layer.promise)]));
      if (!current()) return;
      const cards = entries.map(createCard);
      await Promise.all(cards.flatMap(({ images }) => images.map(image => image.decode())));
      if (!current()) return;
      wrap.dataset.layout = arrangements[slug] || 'fan';
      wrap.dataset.project = slug || '';
      // A small, stable tilt change keeps related projects from sharing one stack.
      const seed = [...(slug || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      wrap.style.setProperty('--preview-tilt', `${(seed % 5) - 2}deg`);
      wrap.replaceChildren(...cards.map(({ card }) => card));
      wrap.dataset.previewCount = String(cards.length);
      wrap.dataset.projectIndex = i;
      stage.classList.remove('is-changing');
      stage.classList.toggle('is-visible', position());
    } catch { if (current()) { wrap.replaceChildren(); stage.classList.remove('is-changing', 'is-visible'); } }
  };

  const focusedIndex = () => rows.findIndex(row => row.contains(document.activeElement));
  document.addEventListener('keydown', event => {
    if (document.documentElement.classList.contains('viewer-open')) return;
    if (!['Tab', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    keyboardFocus = true;
    if (event.key === 'Tab') previewSuppressed = false;
  }, true);
  index.addEventListener('pointermove', event => {
    keyboardFocus = false;
    previewSuppressed = false;
    const i = rows.indexOf(event.target.closest('.project-row'));
    if (i >= 0 && selected !== i) show(i);
  });
  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', () => {
      keyboardFocus = false;
      previewSuppressed = false;
      show(i);
    });
    row.addEventListener('pointerleave', event => {
      if (!keyboardFocus && !event.relatedTarget?.closest('.project-row')) hide();
    });
    row.addEventListener('focusin', () => { if (!previewSuppressed) show(i); });
    row.addEventListener('focusout', () => queueMicrotask(() => { if (focusedIndex() < 0) hide(); }));
  });
  index.addEventListener('pointerleave', () => {
    if (previewSuppressed || !keyboardFocus) { hide(); return; }
    const i = focusedIndex();
    i < 0 ? hide() : show(i);
  });
  const reposition = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      stage.classList.toggle('is-visible', Number(wrap.dataset.projectIndex) === selected && wrap.childElementCount === Number(wrap.dataset.previewCount || 0) && position());
    });
  };
  window.addEventListener('scroll', reposition, { passive: true });
  window.addEventListener('resize', reposition);
  document.addEventListener('portfolio:filter', hide);
  document.addEventListener('portfolio:reveal', () => { previewSuppressed = true; hide(); });
  desktop.addEventListener('change', () => {
    hide();
    if (desktop.matches && !previewSuppressed && focusedIndex() >= 0) show(focusedIndex());
  });
  const basePath = document.documentElement.dataset.basePath || '';
  fetch(`${basePath}/preview-data.json`, { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('Previews unavailable'); return response.json(); })
    .then(data => {
      records = rows.map(row => data.find(record => new URL(row.href, location.href).pathname.replace(/\/$/, '') === `${basePath}${record.route}`.replace(/\/$/, '')));
      if (selected >= 0) show(selected);
    }).catch(hide);
})();
