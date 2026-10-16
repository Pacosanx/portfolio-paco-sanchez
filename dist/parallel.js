(() => {
  const galleries = [...document.querySelectorAll('.lab-gallery')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  galleries.forEach(gallery => {
    const firstSet = gallery.querySelector('.lab-set');
    if (!firstSet) return;

    let setWidth = firstSet.getBoundingClientRect().width;
    let previousTime = 0;
    let pointerDown = false;
    let dragPointerId = null;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let didDrag = false;
    let suppressClick = false;

    const isPaused = () => reducedMotion.matches || pointerDown || document.hidden;

    const normalize = () => {
      if (!setWidth) return;
      if (gallery.scrollLeft >= setWidth) gallery.scrollLeft %= setWidth;
      else if (gallery.scrollLeft < 0) gallery.scrollLeft = (gallery.scrollLeft % setWidth) + setWidth;
    };

    const tick = time => {
      if (previousTime && !isPaused()) gallery.scrollLeft += Math.min(time - previousTime, 50) * 0.042;
      previousTime = time;
      normalize();
      requestAnimationFrame(tick);
    };

    gallery.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerDown = true;
      didDrag = false;
      dragPointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartScroll = gallery.scrollLeft;
    });

    window.addEventListener('pointermove', event => {
      if (event.pointerId !== dragPointerId) return;
      const delta = event.clientX - dragStartX;
      if (Math.abs(delta) > 4) {
        didDrag = true;
        gallery.classList.add('is-dragging');
        event.preventDefault();
      }
      if (!didDrag) return;

      let nextScroll = dragStartScroll - delta;
      if (nextScroll < 0) {
        const loops = Math.ceil(-nextScroll / setWidth);
        dragStartScroll += loops * setWidth;
        nextScroll += loops * setWidth;
      } else if (nextScroll >= setWidth) {
        const loops = Math.floor(nextScroll / setWidth);
        dragStartScroll -= loops * setWidth;
        nextScroll -= loops * setWidth;
      }
      gallery.scrollLeft = nextScroll;
    }, { passive: false });

    const finishPointer = event => {
      if (event.pointerId !== dragPointerId) return;
      pointerDown = false;
      dragPointerId = null;
      gallery.classList.remove('is-dragging');
      if (didDrag) {
        suppressClick = true;
        window.setTimeout(() => { suppressClick = false; }, 0);
      }
    };

    window.addEventListener('pointerup', finishPointer);
    window.addEventListener('pointercancel', finishPointer);

    gallery.addEventListener('click', event => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);

    gallery.addEventListener('scroll', normalize, { passive: true });
    new ResizeObserver(() => {
      setWidth = firstSet.getBoundingClientRect().width;
      normalize();
    }).observe(firstSet);

    requestAnimationFrame(tick);
  });
})();
