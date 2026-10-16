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

  const vertex = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragment = `
    precision mediump float;
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
      vec2 p = uv + (uv - pointer.xy) * influence * 0.22;
      p += parallax * vec2(0.09, 0.055);

      // A small green light sits behind three independently moving blue layers.
      float green = pool(p, vec2(0.67 + 0.025 * sin(t), 0.28), vec2(0.12, 0.27));
      vec3 light = vec3(0.0, 1.0, 0.0) * green * 0.54;
      float deep = pool(p, vec2(0.43, 0.04), vec2(0.93, 0.85));
      float cobalt = pool(p, vec2(0.24 + 0.09 * sin(t), 0.16 + 0.055 * cos(t)), vec2(0.50, 0.49));
      float azure = pool(p, vec2(0.79 + 0.055 * cos(t * 0.8), -0.02 + 0.04 * sin(t)), vec2(0.43, 0.56));
      float ribbon = pool(p, vec2(0.49 + 0.08 * sin(t * 0.7), -0.11), vec2(0.41, 0.57));
      light = screen(light, vec3(0.005, 0.035, 0.32) * deep);
      light = screen(light, vec3(0.018, 0.17, 0.95) * cobalt * 0.87);
      light = screen(light, vec3(0.012, 0.32, 1.0) * azure * 0.69);
      light = screen(light, vec3(0.035, 0.25, 1.0) * ribbon * 0.63);
      light = screen(light, vec3(0.035, 0.18, 0.50) * influence * 0.34);

      // Five square pixels form each +, on a fixed bitmap grid.
      vec2 pixels = gl_FragCoord.xy / pixelRatio;
      vec2 grid = pixels / 14.0;
      vec2 cell = floor(grid);
      vec2 local = (fract(grid) - 0.5) * 14.0;
      float wave = 0.5 + 0.5 * sin(cell.x * 0.19 + cell.y * 0.23 + 1.8 * sin(cell.x * 0.065 + t));
      float density = (0.28 + 0.72 * wave) * (1.0 - smoothstep(0.12, 0.77, uv.y));
      density = min(1.0, density + influence * 0.40);
      float bitSize = 1.0 + step(0.58, density);
      vec2 bit = abs(floor(local / bitSize + 0.5));
      float cross = (1.0 - step(1.5, max(bit.x, bit.y))) * (1.0 - step(0.5, min(bit.x, bit.y)));
      float inkStrength = density * (0.13 + 0.37 * wave);
      vec3 ink = mix(vec3(0.12, 0.39, 1.0), vec3(0.12, 0.76, 0.24), green * 0.60);
      light = screen(light, ink * cross * inkStrength);
      gl_FragColor = vec4(light, (1.0 - smoothstep(0.12, 1.0, uv.y)) * 0.98);
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
