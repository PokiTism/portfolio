// Conway's Game of Life: a live cell survives with 2 or 3 live neighbours,
// a dead cell comes alive with exactly 3. Click or drag to draw cells.
// It starts from a smiley face.
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const toggleButton = document.getElementById('toggle');
const resetButton = document.getElementById('reset');
const randomButton = document.getElementById('random');
const clearButton = document.getElementById('clear');
const speedInput = document.getElementById('speed');
const generationLabel = document.getElementById('generation');

const CELL = 6;
const SMILEY_SCALE = 2;
const SMILEY = [
  '....XXXXXXX....',
  '..XX.......XX..',
  '.X...........X.',
  '.X...........X.',
  'X...XX...XX...X',
  'X...XX...XX...X',
  'X.............X',
  'X.............X',
  'X..X.......X..X',
  'X...X.....X...X',
  '.X...XXXXX...X.',
  '.X...........X.',
  '..XX.......XX..',
  '....XXXXXXX....',
];
const DEAD_COLOR = '#000';
const ALIVE_COLOR = '#fff';

let cols;
let rows;
let grid;
let generation;
let running = false;
let drawing = false;
let lastStepTime = 0;

function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  cols = Math.floor(canvas.width / CELL);
  rows = Math.floor(canvas.height / CELL);
}

function fill(chance) {
  grid = new Uint8Array(cols * rows);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() < chance ? 1 : 0;
  }
  generation = 0;
  draw();
}

function smiley() {
  grid = new Uint8Array(cols * rows);
  const top = Math.floor((rows - SMILEY.length * SMILEY_SCALE) / 2);
  const left = Math.floor((cols - SMILEY[0].length * SMILEY_SCALE) / 2);
  SMILEY.forEach((line, y) => {
    [...line].forEach((ch, x) => {
      if (ch !== 'X') return;
      for (let dy = 0; dy < SMILEY_SCALE; dy++) {
        for (let dx = 0; dx < SMILEY_SCALE; dx++) {
          const cy = top + y * SMILEY_SCALE + dy;
          const cx = left + x * SMILEY_SCALE + dx;
          if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) grid[cy * cols + cx] = 1;
        }
      }
    });
  });
  generation = 0;
  draw();
}

function step() {
  const next = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let neighbours = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          // Wrap around the edges.
          const nx = (x + dx + cols) % cols;
          const ny = (y + dy + rows) % rows;
          neighbours += grid[ny * cols + nx];
        }
      }
      const i = y * cols + x;
      next[i] = neighbours === 3 || (grid[i] && neighbours === 2) ? 1 : 0;
    }
  }
  grid = next;
  generation++;
}

function draw() {
  ctx.fillStyle = DEAD_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = ALIVE_COLOR;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y * cols + x]) {
        ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
      }
    }
  }
  generationLabel.textContent = 'Karta: ' + generation.toLocaleString('lt-LT');
}

function frame(time) {
  if (!running) return;
  if (time - lastStepTime >= 1000 / Number(speedInput.value)) {
    step();
    draw();
    lastStepTime = time;
  }
  requestAnimationFrame(frame);
}

function drawCellAt(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / CELL);
  const y = Math.floor((event.clientY - rect.top) / CELL);
  if (x < 0 || y < 0 || x >= cols || y >= rows) return;
  grid[y * cols + x] = 1;
  draw();
}

toggleButton.addEventListener('click', () => {
  running = !running;
  const label = running ? 'Pauzė' : 'Pradėti';
  toggleButton.classList.toggle('running', running);
  toggleButton.title = label;
  toggleButton.setAttribute('aria-label', label);
  if (running) requestAnimationFrame(frame);
});

resetButton.addEventListener('click', smiley);
randomButton.addEventListener('click', () => fill(0.25));
clearButton.addEventListener('click', () => fill(0));

canvas.addEventListener('pointerdown', (event) => {
  drawing = true;
  drawCellAt(event);
});
canvas.addEventListener('pointermove', (event) => {
  if (drawing) drawCellAt(event);
});
window.addEventListener('pointerup', () => {
  drawing = false;
});

window.addEventListener('resize', () => {
  resize();
  smiley();
});

resize();
smiley();
