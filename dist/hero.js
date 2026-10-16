// Decorative light field. CSS stays visible if WebGL is unavailable.
(() => {
  const canvas = document.querySelector('.opening-shader');
  if (!canvas) return;
  const field = canvas.parentElement;
  const opening = field.closest('.opening');
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: false, powerPreference: 'low-power'
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

    float pool(vec2 p, vec2 center, vec2 size) {
      vec2 d = (p - center) / size;
      return exp(-dot(d, d) * 2.0);
    }
    vec3 screen(vec3 base, vec3 layer) {
      return 1.0 - (1.0 - base) * (1.0 - layer);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      float t = time * 0.13;
      vec2 distanceToPointer = (uv - pointer.xy) * vec2(resolution.x / resolution.y, 1.0);
      float influence = exp(-dot(distanceToPointer, distanceToPointer) * 3.5) * pointer.z;
      vec2 parallax = (pointer.xy - vec2(0.5, 0.35)) * pointer.z;

      // Inverse barrel projection: the grid opens out and rises at the edges.
      vec2 lensCenter = vec2(0.5 + parallax.x * 0.055, -0.12);
      vec2 lensScale = vec2(1.75, 1.0);
      vec2 lensRay = (uv - lensCenter) * lensScale;
      float barrel = 1.0 + dot(lensRay, lensRay) * 0.48;
      vec2 surface = lensCenter + lensRay / barrel / lensScale;
      float swell = sin(surface.x * 8.0 + t * 0.7) * 0.035;
      swell += sin(surface.x * 17.0 - t * 0.45) * 0.014;
      surface.y += swell * smoothstep(0.02, 0.65, uv.y);
      vec2 p = surface + (uv - pointer.xy) * influence * 0.22;
      p += parallax * vec2(0.09, 0.055);

      // Layered white light forms the broad, horizontal ribbon from the sketch.
      float core = pool(p, vec2(0.50 + 0.025 * sin(t * 0.7), 0.49), vec2(0.72, 0.25));
      float leftGlow = pool(p, vec2(0.10, 0.48), vec2(0.38, 0.31));
      float rightGlow = pool(p, vec2(0.90, 0.50), vec2(0.38, 0.31));
      float haze = pool(p, vec2(0.50, 0.48), vec2(0.92, 0.43));
      float light = min(1.0, haze * 0.18 + leftGlow * 0.55 + rightGlow * 0.55 + core * 0.42 + influence * 0.16);
      light = 1.0 - exp(-light * 2.2);

      // The bitmap crosses share the lens projection of the light field.
      vec2 pixels = surface * resolution / pixelRatio;
      vec2 grid = pixels / 14.0;
      vec2 cell = floor(grid);
      vec2 local = (fract(grid) - 0.5) * 14.0;
      float wave = 0.5 + 0.5 * sin(cell.x * 0.19 + cell.y * 0.23 + 1.8 * sin(cell.x * 0.065 + t));
      float density = (0.28 + 0.72 * wave) * (1.0 - smoothstep(0.12, 0.77, surface.y));
      density = min(1.0, density + influence * 0.40);
      // Two antialiased strokes, kept thin even where the lens stretches them.
      vec2 footprint = ${derivatives ? 'vec2(length(vec2(dFdx(pixels.x), dFdy(pixels.x))), length(vec2(dFdx(pixels.y), dFdy(pixels.y))))' : 'vec2(1.0 / pixelRatio)'};
      vec2 stroke = max(vec2(0.05), footprint * pixelRatio * 0.45);
      vec2 aa = max(vec2(0.035), footprint * 0.50);
      float arm = 2.6 + density * 0.65;
      float horizontal = (1.0 - smoothstep(arm - aa.x, arm + aa.x, abs(local.x))) * (1.0 - smoothstep(max(0.0, stroke.y - aa.y), stroke.y + aa.y, abs(local.y)));
      float vertical = (1.0 - smoothstep(max(0.0, stroke.x - aa.x), stroke.x + aa.x, abs(local.x))) * (1.0 - smoothstep(arm - aa.y, arm + aa.y, abs(local.y)));
      float cross = max(horizontal, vertical);
      float inkStrength = density * (0.19 + 0.45 * wave);
      light = min(1.0, light + cross * inkStrength * 0.76);
      float veil = 1.0;
      float sides = pow(abs(uv.x - 0.5) * 2.0, 1.7);
      float contour = sides * 0.075 + sin(uv.x * 7.0 + t * 0.35) * 0.018;
      contour += sin(uv.x * 13.0 - t * 0.30) * 0.010;
      float crest = 0.79 + contour;
      float floor = 0.20 - contour;
      float edgeFade = 0.13;
      veil *= (1.0 - smoothstep(crest - edgeFade, crest + edgeFade, uv.y)) * smoothstep(floor - edgeFade, floor + edgeFade, uv.y);
      gl_FragColor = vec4(vec3(light), veil * 0.98);
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
  const uniforms = Object.fromEntries(['resolution', 'pixelRatio', 'time', 'pointer'].map(key => [key, gl.getUniformLocation(program, key)]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;
  let frame = 0;
  let last = -Infinity;
  let elapsed = 0;
  let lost = false;
  const targetPointer = { x: 0.5, y: 0.35, active: 0 };
  const pointer = { ...targetPointer };

  function draw() {
    if (lost) return;
    gl.uniform1f(uniforms.time, reduced.matches ? 0 : elapsed);
    gl.uniform3f(uniforms.pointer, pointer.x, pointer.y, reduced.matches ? 0 : pointer.active);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function resize() {
    const { width, height } = field.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1400000 / Math.max(1, width * height)));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.pixelRatio, ratio);
    draw();
  }
  function animate(now) {
    frame = 0;
    if (!inView || document.hidden || reduced.matches || lost) return;
    if (now - last >= 1000 / 30) {
      const dt = Number.isFinite(last) ? Math.min(now - last, 80) / 1000 : 1 / 30;
      elapsed += dt;
      const follow = 1 - Math.exp(-dt * 9);
      for (const key of ['x', 'y', 'active']) pointer[key] += (targetPointer[key] - pointer[key]) * follow;
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
  reduced.addEventListener('change', sync);
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
    field.classList.remove('is-webgl');
  });
  sync();
})();
