// Animated background: a slow, domain-warped noise field in dark Catppuccin
// Mocha tones, drawn with WebGL behind the whole page. Falls back to the
// plain body background when WebGL is missing, and to a still frame when
// the visitor prefers reduced motion.
(() => {
  // Render at half resolution; CSS scales the canvas up to fill the window.
  const SCALE = 0.5;
  // Seconds of shader time to show when motion is reduced.
  const STILL_TIME = 240;

  const VERTEX_SHADER = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    uniform vec2 u_resolution;
    uniform float u_time;

    const vec3 CRUST = vec3(17.0, 17.0, 27.0) / 255.0;
    const vec3 MANTLE = vec3(24.0, 24.0, 37.0) / 255.0;
    const vec3 BASE = vec3(30.0, 30.0, 46.0) / 255.0;
    const vec3 TEAL = vec3(148.0, 226.0, 213.0) / 255.0;
    // Strongest teal mix, reached only in the lightest spots.
    const float TEAL_AMOUNT = 0.1;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // Fractal noise. Each octave is scaled and turned by a fixed matrix so
    // the layers don't line up; nothing here rotates over time.
    float fbm(vec2 p) {
      const mat2 OCTAVE = mat2(1.6, 1.2, -1.2, 1.6);
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p = OCTAVE * p;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      // Square units so the pattern doesn't stretch with the window shape.
      vec2 uv = gl_FragCoord.xy / u_resolution.y;
      float t = u_time * 0.01;

      // Slow, steady drift of the whole field.
      vec2 p = uv * 2.2 + vec2(t * 0.6, t * 0.25);

      // Domain warping: each level samples fbm at coordinates pushed
      // around by the level before it.
      vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0) + t),
        fbm(p + vec2(5.2, 1.3) - t)
      );
      vec2 r = vec2(
        fbm(p + 3.5 * q + vec2(1.7, 9.2) + 0.7 * t),
        fbm(p + 3.5 * q + vec2(8.3, 2.8) - 0.5 * t)
      );
      float f = fbm(p + 3.5 * r);

      // Soft paint-like bands: flat plateaus joined by smooth steps.
      float shade = clamp((f - 0.3) / 0.45, 0.0, 1.0);
      float bands = 5.0;
      float x = shade * bands;
      shade = mix(shade, (floor(x) + smoothstep(0.3, 0.7, fract(x))) / bands, 0.6);

      vec3 color = mix(CRUST, MANTLE, smoothstep(0.0, 0.45, shade));
      color = mix(color, BASE, smoothstep(0.4, 0.85, shade));
      color = mix(color, TEAL, TEAL_AMOUNT * smoothstep(0.8, 1.0, shade) * smoothstep(0.3, 0.8, r.x));

      // A little dither so the dark gradients don't show 8-bit steps.
      color += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const canvas = document.createElement('canvas');
  canvas.className = 'bg';
  canvas.setAttribute('aria-hidden', 'true');

  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
  if (!gl) return;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  // One triangle that covers the whole screen.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const resolutionUniform = gl.getUniformLocation(program, 'u_resolution');
  const timeUniform = gl.getUniformLocation(program, 'u_time');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animating = false;

  // Wall-clock time, so the background carries on smoothly from page to
  // page instead of restarting. Wrapped to keep shader floats precise.
  function now() {
    return (Date.now() / 1000) % 3600;
  }

  function draw(time) {
    gl.uniform1f(timeUniform, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function resize() {
    canvas.width = Math.max(1, Math.round(window.innerWidth * SCALE));
    canvas.height = Math.max(1, Math.round(window.innerHeight * SCALE));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
    if (!animating) draw(STILL_TIME);
  }

  function frame() {
    if (reducedMotion.matches) {
      animating = false;
      draw(STILL_TIME);
      return;
    }
    draw(now());
    requestAnimationFrame(frame);
  }

  function start() {
    if (animating || reducedMotion.matches) return;
    animating = true;
    requestAnimationFrame(frame);
  }

  document.body.prepend(canvas);
  resize();
  start();
  window.addEventListener('resize', resize);
  reducedMotion.addEventListener('change', start);
})();
