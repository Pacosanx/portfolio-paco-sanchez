// Decorative light field. CSS stays visible if WebGL is unavailable.
(() => {
  const canvas = document.querySelector('.opening-shader');
  if (!canvas) return;
  const field = canvas.parentElement;
  const opening = field.closest('.opening');
  const header = document.querySelector('.site-header');
  if (header) {
    const syncHeroHeight = () => opening.style.setProperty('--hero-header-height', `${header.getBoundingClientRect().height}px`);
    syncHeroHeight();
    new ResizeObserver(syncHeroHeight).observe(header);
  }
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: true, powerPreference: 'low-power'
  });
  if (!gl) return;
  const derivatives = gl.getExtension('OES_standard_derivatives');

  const vertex = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragment = `
    ${derivatives ? '#extension GL_OES_standard_derivatives : enable' : ''}
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform vec2 resolution;
    uniform float pixelRatio;
    uniform float time;
    uniform vec3 pointer;
    uniform float scrollProgress;
    uniform vec3 viewGeometry;

    float bayer2(vec2 p) {
      p = mod(floor(p), 2.0);
      return mod(2.0 * p.x + 3.0 * p.y, 4.0);
    }
    float profile(float d, float width) {
      float normalizedDistance = d / width;
      return exp(-(normalizedDistance * normalizedDistance) * 1.35);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      // Lens coordinates stay in the viewport while the plane passes through them.
      float screenY = (1.0 - uv.y) * viewGeometry.y + viewGeometry.x;
      vec2 viewUV = vec2(uv.x, 1.0 - screenY / viewGeometry.z);
      vec2 ray = (viewUV - 0.5) * 2.0;
      float travel = 1.0 - pow(1.0 - scrollProgress, 1.6);
      float bandY = mix(0.16, 1.16, travel);
      float width = 0.12 + 0.08 * sin(travel * 3.14159265);
      float curvature = mix(0.42, 1.0, smoothstep(0.0, 0.36, travel));
      vec2 surface = vec2(0.5 + (viewUV.x - 0.5) / (1.0 + 0.30 * ray.y * ray.y),
                          0.5 + (viewUV.y - 0.5) / (1.0 + curvature * ray.x * ray.x + 0.20 * ray.y * ray.y));
      vec2 cursorUV = vec2(pointer.x, 1.0 - ((1.0 - pointer.y) * viewGeometry.y + viewGeometry.x) / viewGeometry.z);
      vec2 delta = (viewUV - cursorUV) * vec2(resolution.x / pixelRatio / viewGeometry.z, 1.0);
      float touch = exp(-dot(delta, delta) * 18.0) * pointer.z;
      surface += (viewUV - cursorUV) * touch * 0.15;
      float d = surface.y - bandY;
      d += sin(viewUV.x * 5.0 + time * 0.18) * 0.003;

      // One continuous cobalt / cyan / green gradient, refracted by the same lens.
      float edges = pow(abs(ray.x), 0.85);
      float gradientX = surface.x + ray.x * exp(-pow(d / (width * 1.6), 2.0)) * 0.04;
      vec3 cobalt = vec3(0.012, 0.085, 0.84);
      vec3 cyan = vec3(0.0, 0.47, 0.76);
      vec3 tint = mix(cobalt, cyan, clamp(edges * 0.76 + smoothstep(0.52, 0.97, gradientX) * 0.16, 0.0, 1.0));
      float greenDistance = (gradientX - 0.76) / 0.12;
      float green = exp(-(greenDistance * greenDistance));
      tint = mix(tint, vec3(0.005, 0.64, 0.24), green * 0.30);
      float split = (0.002 + edges * 0.004) * sin(travel * 3.14159265);
      vec3 core = vec3(profile(d + split, width), profile(d, width), profile(d - split, width));
      float halo = profile(d, width + 0.045);
      vec3 light = tint * (0.45 + core * 0.55);
      // Fill the viewport's lower edge on arrival; soften the plane as it scrolls away.
      float edgeFade = mix(1.0, smoothstep(0.0, 0.16, uv.y), smoothstep(0.0, 0.12, travel));
      float alpha = clamp(halo * 1.7, 0.0, 0.98) * edgeFade;

      // Small crosses travel with the plane and share its refraction, revealing the lens.
      vec2 grid = vec2(surface.x * resolution.x / pixelRatio, (surface.y - bandY) * viewGeometry.z) / 10.0;
      vec2 cell = floor(grid);
      vec2 local = abs((fract(grid) - 0.5) * 10.0);
      vec2 aa = ${derivatives ? 'max(vec2(0.18), fwidth(grid) * 7.0)' : 'vec2(0.6)'};
      vec2 arm = 1.0 - smoothstep(vec2(1.55) - aa, vec2(1.55) + aa, local);
      vec2 stroke = 1.0 - smoothstep(max(vec2(0.0), vec2(0.32) - aa), vec2(0.32) + aa, local);
      float cross = max(arm.x * stroke.y, arm.y * stroke.x);
      float textureStrength = (0.65 + 0.35 * sin(cell.x * 0.17 + cell.y * 0.11)) * profile(d, width * 1.15);
      vec3 ink = mix(vec3(0.30, 0.55, 1.0), vec3(0.24, 0.86, 0.65), smoothstep(0.5, 0.9, surface.x));
      light = 1.0 - (1.0 - light) * (1.0 - ink * cross * textureStrength * 0.28);

      // One-pixel ordered dither keeps the underlying gradient fine.
      vec2 pixels = floor(gl_FragCoord.xy / pixelRatio);
      float threshold = (4.0 * bayer2(pixels) + bayer2(pixels / 2.0) + 0.5) / 16.0 - 0.5;
      light = floor(light * 64.0 + threshold + 0.5) / 64.0;
      // Chrome's compositor expects premultiplied colors for a transparent WebGL canvas.
      gl_FragColor = vec4(max(vec3(0.0), light) * alpha, alpha);
    }
  `;

  const shaders = [];
  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    shaders.push(shader);
    return shader;
  }
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    shaders.forEach(shader => gl.deleteShader(shader));
    if (program) gl.deleteProgram(program);
    return;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  shaders.forEach(shader => gl.deleteShader(shader));
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return;
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['resolution', 'pixelRatio', 'time', 'pointer', 'scrollProgress', 'viewGeometry'].map(key => [key, gl.getUniformLocation(program, key)]));
  const compactDevice = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  const lensMapWidth = compactDevice ? 64 : 128;
  const lensMapHeight = compactDevice ? 32 : 64;
  const lensPixelBudget = compactDevice ? 280000 : 1100000;
  const lensPixelRatioLimit = compactDevice ? 1 : 1.35;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;
  let frame = 0;
  let last = -Infinity;
  let elapsed = 0;
  let lost = false;
  const targetPointer = { x: 0.5, y: 0.35, active: 0 };
  const pointer = { ...targetPointer };
  let targetScroll = 0;
  let scrollProgress = 0;
  const svgNS = 'http://www.w3.org/2000/svg';
  const filterSvg = document.createElementNS(svgNS, 'svg');
  filterSvg.setAttribute('aria-hidden', 'true');
  filterSvg.setAttribute('width', '0');
  filterSvg.setAttribute('height', '0');
  filterSvg.style.position = 'absolute';
  opening.prepend(filterSvg);
  const textTargets = compactDevice ? '.opening-copy' : '.opening-label, .opening-copy, .opening-lead, .opening-cue';
  const textLenses = [...opening.querySelectorAll(textTargets)].map((element, index) => {
    const filter = document.createElementNS(svgNS, 'filter');
    filter.id = `opening-scroll-lens-${index}`;
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const map = document.createElementNS(svgNS, 'feImage');
    map.setAttribute('result', 'refraction');
    map.setAttribute('preserveAspectRatio', 'none');
    const smoothMap = document.createElementNS(svgNS, 'feGaussianBlur');
    smoothMap.setAttribute('in', 'refraction');
    smoothMap.setAttribute('stdDeviation', '1.5');
    smoothMap.setAttribute('result', 'smooth-refraction');
    const displacement = document.createElementNS(svgNS, 'feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'smooth-refraction');
    displacement.setAttribute('scale', '64');
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    displacement.setAttribute('result', 'refracted-text');
    const softText = document.createElementNS(svgNS, 'feGaussianBlur');
    softText.setAttribute('in', 'refracted-text');
    softText.setAttribute('stdDeviation', '0.55');
    softText.setAttribute('result', 'soft-text');
    const red = document.createElementNS(svgNS, 'feColorMatrix');
    red.setAttribute('in', 'soft-text');
    red.setAttribute('type', 'matrix');
    red.setAttribute('values', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0');
    red.setAttribute('result', 'red-channel');
    const green = document.createElementNS(svgNS, 'feColorMatrix');
    green.setAttribute('in', 'soft-text');
    green.setAttribute('type', 'matrix');
    green.setAttribute('values', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0');
    green.setAttribute('result', 'green-channel');
    const blue = document.createElementNS(svgNS, 'feColorMatrix');
    blue.setAttribute('in', 'soft-text');
    blue.setAttribute('type', 'matrix');
    blue.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0');
    blue.setAttribute('result', 'blue-channel');
    const redOffset = document.createElementNS(svgNS, 'feOffset');
    redOffset.setAttribute('in', 'red-channel');
    redOffset.setAttribute('dx', '0.8');
    redOffset.setAttribute('result', 'red-fringe');
    const blueOffset = document.createElementNS(svgNS, 'feOffset');
    blueOffset.setAttribute('in', 'blue-channel');
    blueOffset.setAttribute('dx', '-0.8');
    blueOffset.setAttribute('result', 'blue-fringe');
    const redGreen = document.createElementNS(svgNS, 'feBlend');
    redGreen.setAttribute('in', 'red-fringe');
    redGreen.setAttribute('in2', 'green-channel');
    redGreen.setAttribute('mode', 'screen');
    redGreen.setAttribute('result', 'red-green-text');
    const chromaticText = document.createElementNS(svgNS, 'feBlend');
    chromaticText.setAttribute('in', 'red-green-text');
    chromaticText.setAttribute('in2', 'blue-fringe');
    chromaticText.setAttribute('mode', 'screen');
    filter.append(map, smoothMap, displacement, softText, red, green, blue, redOffset, blueOffset, redGreen, chromaticText);
    filterSvg.append(filter);
    const bitmap = document.createElement('canvas');
    bitmap.width = lensMapWidth;
    bitmap.height = lensMapHeight;
    return { element, filter, map, bitmap, context: bitmap.getContext('2d'), redOffset, blueOffset };
  });
  let lastLensProgress = -1;
  let lastLensScroll = -1;
  let lastLensSize = '';
  let lastLensUpdate = -Infinity;

  function refractText(fieldBounds) {
    const size = `${innerWidth}:${innerHeight}`;
    const now = performance.now();
    const progressStep = compactDevice ? 0.004 : 0.001;
    const scrollStep = compactDevice ? 2.5 : 0.5;
    if (Math.abs(lastLensProgress - scrollProgress) < progressStep && Math.abs(lastLensScroll - scrollY) < scrollStep && lastLensSize === size) return;
    const lensUpdateRate = compactDevice ? 15 : 24;
    if (now - lastLensUpdate < 1000 / lensUpdateRate && lastLensSize === size) return;
    lastLensProgress = scrollProgress;
    lastLensScroll = scrollY;
    lastLensSize = size;
    lastLensUpdate = now;
    const travel = 1 - Math.pow(1 - scrollProgress, 1.6);
    const bandY = 0.16 + travel;
    const width = 0.12 + 0.08 * Math.sin(travel * Math.PI);
    const bend = Math.min(1, travel / 0.36);
    const curvature = 0.42 + 0.58 * bend * bend * (3 - 2 * bend);
    const smooth = (from, to, value) => {
      const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
      return t * t * (3 - 2 * t);
    };
    for (const lens of textLenses) {
      const bounds = lens.element.getBoundingClientRect();
      if (!lens.context || reduced.matches || scrollProgress < 0.015 || bounds.bottom < 0 || bounds.top > innerHeight) {
        lens.element.style.removeProperty('filter');
        continue;
      }
      const centerX = (bounds.left + bounds.right) * 0.5;
      const centerY = (bounds.top + bounds.bottom) * 0.5;
      const centerRayX = ((centerX - fieldBounds.left) / fieldBounds.width - 0.5) * 2;
      const centerViewY = 1 - centerY / innerHeight;
      const centerRayY = (centerViewY - 0.5) * 2;
      const centerSurfaceY = 0.5 + (centerViewY - 0.5) / (1 + curvature * centerRayX * centerRayX + 0.20 * centerRayY * centerRayY);
      const centerDistance = (centerSurfaceY - bandY) / width;
      if (Math.abs(centerDistance) > 2.8) {
        lens.element.style.removeProperty('filter');
        continue;
      }
      const distortionFade = smooth(0.015, 0.22, scrollProgress);
      const departure = smooth(0.12, 0.48, scrollProgress) * (1 - smooth(12, 180, bounds.top));
      const channelShift = 0.25 + departure * 1.2;
      lens.redOffset.setAttribute('dx', `${channelShift}`);
      lens.blueOffset.setAttribute('dx', `${-channelShift}`);
      const pad = 32;
      const w = bounds.width + pad * 2;
      const h = bounds.height + pad * 2;
      const image = lens.context.createImageData(lensMapWidth, lensMapHeight);
      let strongest = 0;
      for (let y = 0; y < lensMapHeight; y++) {
        for (let x = 0; x < lensMapWidth; x++) {
          const screenX = bounds.left - pad + (x + 0.5) / lensMapWidth * w;
          const screenY = bounds.top - pad + (y + 0.5) / lensMapHeight * h;
          const rx = ((screenX - fieldBounds.left) / fieldBounds.width - 0.5) * 2;
          const vy = 1 - screenY / innerHeight;
          const ry = (vy - 0.5) * 2;
          const surfaceY = 0.5 + (vy - 0.5) / (1 + curvature * rx * rx + 0.20 * ry * ry);
          const d = (surfaceY - bandY) / width;
          const influence = Math.exp(-d * d * 1.35);
          strongest = Math.max(strongest, influence);
          const offset = (y * lensMapWidth + x) * 4;
          image.data[offset] = 128 + rx * influence * 20 / 64 * 255 * distortionFade;
          image.data[offset + 1] = 128 - d * influence * 42 / 64 * 255 * distortionFade;
          image.data[offset + 2] = 128;
          image.data[offset + 3] = 255;
        }
      }
      if (strongest < 0.025) {
        lens.element.style.removeProperty('filter');
        continue;
      }
      for (const node of [lens.filter, lens.map]) {
        node.setAttribute('x', `${-pad}`);
        node.setAttribute('y', `${-pad}`);
        node.setAttribute('width', `${w}`);
        node.setAttribute('height', `${h}`);
      }
      lens.context.putImageData(image, 0, 0);
      lens.map.setAttribute('href', lens.bitmap.toDataURL());
      lens.element.style.filter = `url(#${lens.filter.id})`;
    }
  }

  function draw() {
    if (lost) return;
    gl.uniform1f(uniforms.time, reduced.matches ? 0 : elapsed);
    gl.uniform3f(uniforms.pointer, pointer.x, pointer.y, reduced.matches ? 0 : pointer.active);
    gl.uniform1f(uniforms.scrollProgress, scrollProgress);
    const fieldBounds = field.getBoundingClientRect();
    gl.uniform3f(uniforms.viewGeometry, fieldBounds.top, fieldBounds.height, innerHeight);
    refractText(fieldBounds);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function updateScroll() {
    const bounds = opening.getBoundingClientRect();
    targetScroll = Math.max(0, Math.min(1, scrollY / Math.max(1, Math.min(bounds.height * 1.05, innerHeight * 1.05))));
    if (reduced.matches) {
      scrollProgress = targetScroll;
      draw();
    } else if (Math.abs(targetScroll - scrollProgress) > 0.12) {
      // Large scroll jumps should never leave the lens behind a clipped section edge.
      scrollProgress = targetScroll;
      draw();
      if (inView && !frame) sync();
    } else if (inView && !frame) {
      sync();
    }
  }
  function resize() {
    const { width, height } = field.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, lensPixelRatioLimit, Math.sqrt(lensPixelBudget / Math.max(1, width * height)));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.pixelRatio, ratio);
    lastLensProgress = -1;
    updateScroll();
    draw();
  }
  function animate(now) {
    frame = 0;
    if (!inView || document.hidden || reduced.matches || lost) return;
    const scrollMoving = Math.abs(targetScroll - scrollProgress) > 0.002;
    const pointerMoving = Math.abs(targetPointer.x - pointer.x) + Math.abs(targetPointer.y - pointer.y) + Math.abs(targetPointer.active - pointer.active) > 0.01;
    const frameRate = compactDevice ? (scrollMoving || pointerMoving ? 24 : 15) : (scrollMoving || pointerMoving ? 30 : 24);
    const frameInterval = 1000 / frameRate;
    if (now - last >= frameInterval) {
      const dt = Number.isFinite(last) ? Math.min(now - last, 80) / 1000 : 1 / 30;
      elapsed += dt;
      const follow = 1 - Math.exp(-dt * 9);
      for (const key of ['x', 'y', 'active']) pointer[key] += (targetPointer[key] - pointer[key]) * follow;
      scrollProgress += (targetScroll - scrollProgress) * (1 - Math.exp(-dt * 6));
      last = now;
      draw();
    }
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = -Infinity;
    if (reduced.matches) draw();
    else if (inView && !document.hidden && !lost) frame = requestAnimationFrame(animate);
  }
  resize();
  field.classList.add('is-webgl');
  new ResizeObserver(resize).observe(field);
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(opening);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { lastLensProgress = -1; sync(); });
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();
  opening.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reduced.matches) return;
    const bounds = field.getBoundingClientRect();
    targetPointer.x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    targetPointer.y = Math.max(-0.2, Math.min(1.3, 1 - (event.clientY - bounds.top) / bounds.height));
    targetPointer.active = 1;
  }, { passive: true });
  opening.addEventListener('pointerleave', () => { targetPointer.active = 0; });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    textLenses.forEach(lens => lens.element.style.removeProperty('filter'));
    field.classList.remove('is-webgl');
  });
  sync();
})();
