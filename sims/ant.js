// Langton's Ant: on a white cell turn right, on a black cell turn left,
// flip the cell, then step forward.
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const toggleButton = document.getElementById('toggle');
const resetButton = document.getElementById('reset');
const speedInput = document.getElementById('speed');
const stepsLabel = document.getElementById('steps');

const CELL = 4;
const EMPTY_COLOR = '#fff';
const FILLED_COLOR = '#000';
const ANT_COLOR = '#e00';

// Up, right, down, left.
const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

let cols;
let rows;
let grid;
let antX;
let antY;
let direction;
let steps;
let running = false;

function reset() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  cols = Math.floor(canvas.width / CELL);
  rows = Math.floor(canvas.height / CELL);
  grid = new Uint8Array(cols * rows);
  antX = Math.floor(cols / 2);
  antY = Math.floor(rows / 2);
  direction = 0;
  steps = 0;
  ctx.fillStyle = EMPTY_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawAnt();
  updateStepsLabel();
}

function step() {
  const i = antY * cols + antX;
  if (grid[i] === 0) {
    direction = (direction + 1) % 4;
    grid[i] = 1;
  } else {
    direction = (direction + 3) % 4;
    grid[i] = 0;
  }
  ctx.fillStyle = grid[i] ? FILLED_COLOR : EMPTY_COLOR;
  ctx.fillRect(antX * CELL, antY * CELL, CELL, CELL);

  // Wrap around the edges.
  antX = (antX + DIRECTIONS[direction][0] + cols) % cols;
  antY = (antY + DIRECTIONS[direction][1] + rows) % rows;
  steps++;
}

function drawAnt() {
  ctx.fillStyle = ANT_COLOR;
  ctx.fillRect(antX * CELL, antY * CELL, CELL, CELL);
}

function updateStepsLabel() {
  stepsLabel.textContent = 'Žingsniai: ' + steps.toLocaleString('lt-LT');
}

function frame() {
  if (!running) return;
  const stepsPerFrame = Number(speedInput.value);
  for (let n = 0; n < stepsPerFrame; n++) {
    step();
  }
  drawAnt();
  updateStepsLabel();
  requestAnimationFrame(frame);
}

toggleButton.addEventListener('click', () => {
  running = !running;
  toggleButton.textContent = running ? 'Pauzė' : 'Pradėti';
  if (running) requestAnimationFrame(frame);
});

resetButton.addEventListener('click', reset);
window.addEventListener('resize', reset);

reset();
