// Mandelbrot set: a point c belongs to the set if z = z² + c, starting at 0,
// never escapes. Points outside are coloured by how fast they escape.
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('reset');
const zoomLabel = document.getElementById('zoom');

const ZOOM_STEP = 4;
const PALETTE_SIZE = 512;

// Classic blue, white, orange, black gradient, looping back to the start.
const PALETTE_STOPS = [
  [0, [0, 7, 100]],
  [0.16, [32, 107, 203]],
  [0.42, [237, 255, 255]],
  [0.6425, [255, 170, 0]],
  [0.8575, [0, 2, 0]],
  [1, [0, 7, 100]],
];

const palette = buildPalette();

let centerX;
let centerY;
let zoom;

function buildPalette() {
  const colors = [];
  for (let i = 0; i < PALETTE_SIZE; i++) {
    const t = i / PALETTE_SIZE;
    let s = 0;
    while (PALETTE_STOPS[s + 1][0] < t) s++;
    const [t0, c0] = PALETTE_STOPS[s];
    const [t1, c1] = PALETTE_STOPS[s + 1];
    const f = (t - t0) / (t1 - t0);
    colors.push(c0.map((v, k) => Math.round(v + (c1[k] - v) * f)));
  }
  return colors;
}

function reset() {
  centerX = -0.6;
  centerY = 0;
  zoom = 1;
  render();
}

// Width of one pixel in the complex plane.
function pixelSize() {
  return Math.max(3.2 / canvas.width, 2.4 / canvas.height) / zoom;
}

function render() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const { width, height } = canvas;
  const image = ctx.createImageData(width, height);
  const size = pixelSize();
  const maxIterations = Math.min(2000, Math.round(150 + 60 * Math.log2(zoom)));

  for (let py = 0; py < height; py++) {
    const cy = centerY + (py - height / 2) * size;
    for (let px = 0; px < width; px++) {
      const cx = centerX + (px - width / 2) * size;
      let x = 0;
      let y = 0;
      let n = 0;
      while (x * x + y * y <= 256 && n < maxIterations) {
        const nextX = x * x - y * y + cx;
        y = 2 * x * y + cy;
        x = nextX;
        n++;
      }

      const i = (py * width + px) * 4;
      if (n === maxIterations) {
        image.data[i] = 0;
        image.data[i + 1] = 0;
        image.data[i + 2] = 0;
      } else {
        // Smooth the colour bands between whole iteration counts.
        const smooth = n + 1 - Math.log2(Math.log2(Math.sqrt(x * x + y * y)));
        const color = palette[Math.floor(smooth * 8) % PALETTE_SIZE];
        image.data[i] = color[0];
        image.data[i + 1] = color[1];
        image.data[i + 2] = color[2];
      }
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  zoomLabel.textContent = 'Priartinimas: ×' + zoom.toLocaleString('lt-LT');
}

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const size = pixelSize();
  centerX += (event.clientX - rect.left - canvas.width / 2) * size;
  centerY += (event.clientY - rect.top - canvas.height / 2) * size;
  if (event.shiftKey) {
    zoom = Math.max(1, zoom / ZOOM_STEP);
  } else {
    zoom *= ZOOM_STEP;
  }
  render();
});

resetButton.addEventListener('click', reset);
window.addEventListener('resize', render);

reset();
