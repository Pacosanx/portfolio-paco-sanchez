(() => {
  const button = document.querySelector('.back-to-top');
  if (!button) return;

  const canvas = button.querySelector('.back-to-top-shader');
  const context = canvas?.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let frame = 0;

  function draw(now = 0) {
    if (!context) return;
    const size = button.clientWidth;
    if (!size) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(size * pixelRatio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelWidth) {
      canvas.width = pixelWidth;
      canvas.height = pixelWidth;
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, size, size);
    context.save();
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.clip();

    const time = reducedMotion.matches ? 0 : now / 1000;
    const drift = Math.sin(time * 0.35) * size * 0.12;
    const gradient = context.createLinearGradient(-size * 0.1 + drift, size * 0.2, size * 1.1 + drift, size * 0.85);
    gradient.addColorStop(0, '#005baf');
    gradient.addColorStop(0.48, '#0a24dc');
    gradient.addColorStop(0.78, '#008e99');
    gradient.addColorStop(1, '#005baf');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const bandY = size * (0.32 + 0.34 * (0.5 + 0.5 * Math.sin(time * 0.42)));
    const glow = context.createLinearGradient(0, bandY - 9, 0, bandY + 9);
    glow.addColorStop(0, 'rgba(0, 103, 225, 0)');
    glow.addColorStop(0.5, 'rgba(20, 192, 215, 0.34)');
    glow.addColorStop(1, 'rgba(0, 103, 225, 0)');
    context.fillStyle = glow;
    context.fillRect(0, bandY - 9, size, 18);

    for (let y = 5; y < size; y += 9) {
      for (let x = 5; x < size; x += 9) {
        const waveY = y + Math.sin((x / size) * 4 + time * 0.2) * 2;
        if (Math.abs(waveY - bandY) > 12) continue;
        context.globalAlpha = 0.25 + 0.2 * Math.sin(x * 0.17 + y * 0.11);
        context.strokeStyle = x > size * 0.7 ? '#8de2bd' : '#b6d8ff';
        context.lineWidth = 0.8;
        context.beginPath();
        context.moveTo(x - 1.6, waveY);
        context.lineTo(x + 1.6, waveY);
        context.moveTo(x, waveY - 1.6);
        context.lineTo(x, waveY + 1.6);
        context.stroke();
      }
    }
    context.globalAlpha = 1;
    context.restore();
  }

  function animate(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    draw(now);
    if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function updateVisibility() {
    const shouldShow = window.scrollY > 360;
    button.classList.toggle('is-visible', shouldShow);
    button.setAttribute('aria-hidden', String(!shouldShow));
    button.tabIndex = shouldShow ? 0 : -1;
    if (shouldShow && !visible) {
      visible = true;
      draw(performance.now());
      if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
    } else if (!shouldShow && visible) {
      visible = false;
      stopAnimation();
    }
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('resize', () => draw(performance.now()), { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnimation();
    else if (visible) {
      draw(performance.now());
      if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
    }
  });
  reducedMotion.addEventListener('change', () => {
    stopAnimation();
    draw(performance.now());
    if (visible && !reducedMotion.matches) frame = requestAnimationFrame(animate);
  });
  updateVisibility();

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  });
})();
