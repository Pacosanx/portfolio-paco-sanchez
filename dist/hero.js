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

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      float t = time * 0.16;
      float bluePool = exp(-3.2 * pow((uv.x - 0.30 - 0.07 * sin(t)) / 0.76, 2.0));
      float greenPool = exp(-3.0 * pow((uv.x - 0.86 - 0.07 * cos(t * 0.8)) / 0.62, 2.0));
      float rise = 1.0 - smoothstep(0.02, 0.96, uv.y);
      vec3 blue = vec3(0.025, 0.20, 0.92);
      vec3 green = vec3(0.0, 1.0, 0.0);
      vec3 light = blue * bluePool * 0.78 + green * greenPool * 0.53;
      light *= 0.28 + rise * 0.78;

      // A warped halftone grid, with individual diamonds following broad waves.
      vec2 grid = gl_FragCoord.xy / pixelRatio / 13.0;
      grid.x += 0.52 * sin(grid.y * 0.13 + t * 0.7);
      grid.y += 0.70 * sin(grid.x * 0.10 - t * 0.5);
      vec2 cell = floor(grid);
      vec2 local = fract(grid) - 0.5;
      float wave = 0.5 + 0.5 * sin(cell.x * 0.17 + cell.y * 0.24 + 1.7 * sin(cell.x * 0.05 + t));
      float radius = (0.055 + 0.23 * wave) * (1.0 - smoothstep(0.15, 0.92, uv.y));
      float diamond = 1.0 - smoothstep(radius, radius + 0.045, abs(local.x) + abs(local.y));
      vec3 ink = mix(vec3(0.22, 0.57, 1.0), green, smoothstep(0.27, 0.90, uv.x));
      light += ink * diamond * (0.25 + wave * 0.32) * rise;
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
  const uniforms = Object.fromEntries(['resolution', 'pixelRatio', 'time'].map(key => [key, gl.getUniformLocation(program, key)]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;
  let frame = 0;
  let last = -Infinity;
  let elapsed = 0;
  let lost = false;

  function draw() {
    if (lost) return;
    gl.uniform1f(uniforms.time, reduced.matches ? 0 : elapsed);
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
    if (now - last >= 1000 / 24) {
      elapsed += Number.isFinite(last) ? Math.min(now - last, 80) / 1000 : 0;
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
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    field.classList.remove('is-webgl');
  });
  sync();
})();
