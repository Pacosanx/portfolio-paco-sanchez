(() => {
  const galleries = [...document.querySelectorAll('.lab-gallery')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  galleries.forEach(gallery => {
    const firstSet = gallery.querySelector('.lab-set');
    if (!firstSet) return;
    let setWidth = firstSet.getBoundingClientRect().width;
    let previousTime = 0;
    let pointerDown = false;
    const isPaused = () => reducedMotion.matches || gallery.matches(':hover') || gallery.contains(document.activeElement) || pointerDown || document.hidden;
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
    gallery.addEventListener('pointerdown', () => { pointerDown = true; });
    window.addEventListener('pointerup', () => { pointerDown = false; });
    window.addEventListener('pointercancel', () => { pointerDown = false; });
    gallery.addEventListener('scroll', normalize, { passive: true });
    new ResizeObserver(() => { setWidth = firstSet.getBoundingClientRect().width; normalize(); }).observe(firstSet);
    requestAnimationFrame(tick);
  });
})();