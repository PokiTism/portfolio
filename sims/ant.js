// Langton's Ant: on an empty cell turn right, on a filled cell turn left,
// flip the cell, then step forward.
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const toggleButton = document.getElementById('toggle');
const resetButton = document.getElementById('reset');
const speedInput = document.getElementById('speed');
const stepsLabel = document.getElementById('steps');

const CELL = 4;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
const EMPTY_COLOR = '#0f1115';
const FILLED_COLOR = '#7bd88f';
const ANT_COLOR = '#ff6b6b';

// Up, right, down, left.
const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

let grid;
let antX;
let antY;
let direction;
let steps;
let running = false;

function reset() {
  grid = new Uint8Array(COLS * ROWS);
  antX = Math.floor(COLS / 2);
  antY = Math.floor(ROWS / 2);
  direction = 0;
  steps = 0;
  ctx.fillStyle = EMPTY_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawAnt();
  updateStepsLabel();
}

function step() {
  const i = antY * COLS + antX;
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
  antX = (antX + DIRECTIONS[direction][0] + COLS) % COLS;
  antY = (antY + DIRECTIONS[direction][1] + ROWS) % ROWS;
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

reset();
