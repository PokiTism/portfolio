// Boids: each bird follows three rules using only its neighbours.
// Separation (don't crowd), alignment (match heading), cohesion (stay close).
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const toggleButton = document.getElementById('toggle');
const resetButton = document.getElementById('reset');

const COUNT = 200;
const VISUAL_RANGE = 50;
const PROTECTED_RANGE = 12;
const SEPARATION = 0.05;
const ALIGNMENT = 0.05;
const COHESION = 0.0005;
const MIN_SPEED = 2;
const MAX_SPEED = 4;
const BACKGROUND_COLOR = '#000';
const BOID_COLOR = '#fff';

let boids;
let running = false;

function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

function reset() {
  boids = [];
  for (let i = 0; i < COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    boids.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.cos(angle) * MAX_SPEED,
      vy: Math.sin(angle) * MAX_SPEED,
    });
  }
  draw();
}

function step() {
  for (const boid of boids) {
    let closeX = 0;
    let closeY = 0;
    let avgX = 0;
    let avgY = 0;
    let avgVX = 0;
    let avgVY = 0;
    let neighbours = 0;

    for (const other of boids) {
      if (other === boid) continue;
      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < PROTECTED_RANGE * PROTECTED_RANGE) {
        closeX -= dx;
        closeY -= dy;
      } else if (distanceSquared < VISUAL_RANGE * VISUAL_RANGE) {
        avgX += other.x;
        avgY += other.y;
        avgVX += other.vx;
        avgVY += other.vy;
        neighbours++;
      }
    }

    if (neighbours > 0) {
      boid.vx += (avgX / neighbours - boid.x) * COHESION + (avgVX / neighbours - boid.vx) * ALIGNMENT;
      boid.vy += (avgY / neighbours - boid.y) * COHESION + (avgVY / neighbours - boid.vy) * ALIGNMENT;
    }
    boid.vx += closeX * SEPARATION;
    boid.vy += closeY * SEPARATION;

    const speed = Math.hypot(boid.vx, boid.vy);
    const clamped = Math.min(Math.max(speed, MIN_SPEED), MAX_SPEED);
    boid.vx = (boid.vx / speed) * clamped;
    boid.vy = (boid.vy / speed) * clamped;
  }

  for (const boid of boids) {
    // Wrap around the edges.
    boid.x = (boid.x + boid.vx + canvas.width) % canvas.width;
    boid.y = (boid.y + boid.vy + canvas.height) % canvas.height;
  }
}

function draw() {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = BOID_COLOR;
  for (const boid of boids) {
    const angle = Math.atan2(boid.vy, boid.vx);
    ctx.save();
    ctx.translate(boid.x, boid.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, 3);
    ctx.lineTo(-4, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function frame() {
  if (!running) return;
  step();
  draw();
  requestAnimationFrame(frame);
}

toggleButton.addEventListener('click', () => {
  running = !running;
  toggleButton.textContent = running ? 'Pauzė' : 'Pradėti';
  if (running) requestAnimationFrame(frame);
});

resetButton.addEventListener('click', reset);

window.addEventListener('resize', () => {
  resize();
  draw();
});

resize();
reset();
