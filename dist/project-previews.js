(() => {
  const index = document.querySelector('.work-index');
  const stage = document.querySelector('.preview-stage');
  const wrap = stage?.querySelector('.preview-image-wrap');
  if (!index || !stage || !wrap) return;

  const rows = [...index.querySelectorAll('.project-row')];
  const desktop = window.matchMedia('(min-width:1001px)');
  const cache = new Map();
  let records = [], selected = -1, request = 0, keyboardFocus = false;

  const load = asset => {
    if (cache.has(asset.src)) return cache.get(asset.src);
    const image = new Image();
    image.alt = '';
    image.width = asset.width;
    image.height = asset.height;
    image.decoding = 'async';
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
      const usable = entries.filter(entry => !entry.failed && entry.image.classList.contains('is-loaded'));
      wrap.dataset.count = usable.length;
      wrap.dataset.shape = usable.every(entry => entry.asset.height / entry.asset.width > 1.2) ? 'portrait' : 'landscape';
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
  document.addEventListener('keydown', () => { keyboardFocus = true; }, true);
  index.addEventListener('pointermove', event => {
    keyboardFocus = false;
    const row = event.target.closest('.project-row');
    const i = rows.indexOf(row);
    if (i >= 0 && selected !== i) show(i);
  });
  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', () => { if (!keyboardFocus || focusedIndex() < 0) show(i); });
    row.addEventListener('focusin', () => show(i));
    row.addEventListener('focusout', () => queueMicrotask(() => { if (focusedIndex() < 0) hide(); }));
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
    .then(data => {
      // Resolve by route so filtering or reordered rows never reveal another project.
      records = rows.map(row => data.find(record => new URL(row.href || row.querySelector('a')?.href || '/', location.href).pathname.replace(/\/$/, '') === `${basePath}${record.route}`.replace(/\/$/, '')));
      if (selected >= 0) show(selected);
    })
    .catch(hide);
})();
