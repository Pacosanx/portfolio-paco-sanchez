(() => {
  const index = document.querySelector('.work-index');
  const stage = document.querySelector('.preview-stage');
  const wrap = stage?.querySelector('.preview-image-wrap');
  if (!index || !stage || !wrap) return;

  const rows = [...index.querySelectorAll('.project-row')];
  const desktop = window.matchMedia('(min-width:1001px) and (hover:hover)');
  const cache = new Map();
  let records = [], selected = -1, request = 0;

  const load = asset => {
    if (cache.has(asset.src)) return cache.get(asset.src);
    const image = new Image();
    image.alt = '';
    image.width = asset.width;
    image.height = asset.height;
    image.decoding = 'async';
    if(asset.srcset){image.srcset=asset.srcset;image.sizes='320px'}
    image.className = 'preview-image';
    const entry = { image, asset, failed: false };
    entry.promise = new Promise((resolve, reject) => {
      image.onload = async () => {
        try { await image.decode(); } catch { /* The loaded first frame is usable. */ }
        if (image.naturalWidth) {
          image.classList.add('is-loaded');
          resolve(entry);
        } else { entry.failed = true; reject(new Error('Empty preview')); }
      };
      image.onerror = () => {
        entry.failed = true;
        reject(new Error('Preview unavailable'));
      };
    });
    // Cache both the element and its pending decode to avoid repeat requests.
    cache.set(asset.src, entry);
    image.src = asset.src;
    return entry;
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
    rows.forEach((row, j) => row.classList.toggle('is-active', i === j));
    stage.classList.remove('is-visible');
    const assets = (records[i]?.images || []).filter(a => a.src && a.width > 0 && a.height > 0);
    if (!assets.length) { wrap.replaceChildren(); return; }
    const entries = assets.slice(0, 3).map(load);
    const current = () => token === request && selected === i && desktop.matches;
    const render = () => {
      if (!current()) return;
      const usable = entries.filter(entry => !entry.failed);
      wrap.style.setProperty('--preview-ratio-sum', usable.reduce((sum, entry) => sum + entry.asset.height / entry.asset.width, 0));
      wrap.style.setProperty('--preview-gaps', `${Math.max(0, usable.length - 1) * 22}px`);
      wrap.replaceChildren(...usable.map(entry => entry.image));
      stage.classList.toggle('is-visible', usable.some(entry => entry.image.classList.contains('is-loaded')));
    };
    // Reveal the first decoded image while the remaining pieces load quietly.
    try { await Promise.any(entries.map(entry => entry.promise)); } catch { return; }
    render();
    await Promise.allSettled(entries.map(entry => entry.promise));
    render();
  };

  const focusedIndex = () => rows.findIndex(row => row.contains(document.activeElement));
  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', () => show(i));
    row.addEventListener('focus', () => show(i));
    row.addEventListener('blur', () => { if (focusedIndex() < 0) hide(); });
  });
  index.addEventListener('pointerleave', () => {
    const focused = focusedIndex();
    focused < 0 ? hide() : show(focused);
  });
  document.addEventListener('portfolio:filter', hide);
  desktop.addEventListener('change', () => {
    hide();
    if (desktop.matches && focusedIndex() >= 0) show(focusedIndex());
  });
  const basePath = document.documentElement.dataset.basePath || '';
  fetch(`${basePath}/preview-data.json`)
    .then(response => { if (!response.ok) throw new Error('Previews unavailable'); return response.json(); })
    .then(data => { records = data; if (selected >= 0) show(selected); })
    .catch(hide);
})();
