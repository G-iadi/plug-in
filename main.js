// main.js

const canvas = document.getElementById('flower-canvas');
const ctx = canvas.getContext('2d');

// Internal resolution for pixelation effect
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

// Colors (provisional palette)
const COLORS = {
  center: '#4a1c6b',
  centerHighlight: '#6b2d8a',
  filament: '#d946ef',
  filamentTip: '#f0e6ff',
  petal: '#7c3aed',
  petalEdge: '#a78bfa',
};

function resizeCanvas() {
  // Set internal resolution
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  // CSS scales it to full screen
}

function clearCanvas() {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Draw the central disk
function drawCenter(cx, cy, radius, progress) {
  const r = radius * progress;
  if (r <= 0) return;

  const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  grad.addColorStop(0, COLORS.centerHighlight);
  grad.addColorStop(1, COLORS.center);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// Draw a single petal using quadratic Bezier curves
function drawPetal(cx, cy, angle, length, width, progress) {
  const tipX = cx + Math.cos(angle) * length * progress;
  const tipY = cy + Math.sin(angle) * length * progress;

  const cpLen = length * 0.5 * progress;
  const cp1X = cx + Math.cos(angle - 0.5) * cpLen;
  const cp1Y = cy + Math.sin(angle - 0.5) * cpLen;
  const cp2X = cx + Math.cos(angle + 0.5) * cpLen;
  const cp2Y = cy + Math.sin(angle + 0.5) * cpLen;

  ctx.fillStyle = COLORS.petal;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cp1X, cp1Y, tipX, tipY);
  ctx.quadraticCurveTo(cp2X, cp2Y, cx, cy);
  ctx.fill();

  // Edge highlight
  ctx.strokeStyle = COLORS.petalEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cp1X, cp1Y, tipX, tipY);
  ctx.stroke();
}

// Draw a single filament (long, few, random-ish)
function drawFilament(cx, cy, angle, length, progress, curveBias) {
  const endX = cx + Math.cos(angle) * length * progress;
  const endY = cy + Math.sin(angle) * length * progress;

  // Control point for slight curve (stable bias from generateFlowerStructure)
  const cpLen = length * 0.6 * progress;
  const cpX = cx + Math.cos(angle + curveBias) * cpLen;
  const cpY = cy + Math.sin(angle + curveBias) * cpLen;

  const grad = ctx.createLinearGradient(cx, cy, endX, endY);
  grad.addColorStop(0, COLORS.filament);
  grad.addColorStop(1, COLORS.filamentTip);

  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cpX, cpY, endX, endY);
  ctx.stroke();
}

// Generate the flower structure (but not yet animated)
function generateFlowerStructure(cx, cy) {
  const petals = [];
  const filaments = [];
  const numPetals = 8;
  const numFilaments = 18;

  for (let i = 0; i < numPetals; i++) {
    const angle = (Math.PI * 2 / numPetals) * i + (Math.random() - 0.5) * 0.3;
    const length = 80 + Math.random() * 40;
    const width = 25 + Math.random() * 15;
    petals.push({ angle, length, width });
  }

  for (let i = 0; i < numFilaments; i++) {
    const angle = (Math.PI * 2 / numFilaments) * i + (Math.random() - 0.5) * 0.4;
    const length = 110 + Math.random() * 50;
    const curveBias = (Math.random() - 0.5) * 0.3;
    filaments.push({ angle, length, curveBias });
  }

  return { petals, filaments };
}

// Main draw function for a given progress (0 to 1)
function drawFlower(progress) {
  clearCanvas();

  // Asymmetric position: 65% down, 60% from left
  const cx = CANVAS_WIDTH * 0.60;
  const cy = CANVAS_HEIGHT * 0.65;

  // Generate structure once
  if (!window.flowerStructure) {
    window.flowerStructure = generateFlowerStructure(cx, cy);
  }
  const { petals, filaments } = window.flowerStructure;

  // Draw petals first (behind filaments)
  petals.forEach(p => drawPetal(cx, cy, p.angle, p.length, p.width, progress));

  // Draw center
  drawCenter(cx, cy, 25, progress);

  // Draw filaments
  filaments.forEach(f => drawFilament(cx, cy, f.angle, f.length, progress, f.curveBias));

  // Apply dither after drawing
  applyDither();
}

// Apply ordered dithering (Bayer 4x4) to the canvas
function applyDither() {
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Bayer 4x4 threshold map (0-15 scaled to 0-255)
  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Grayscale value
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // Threshold from Bayer matrix
      const threshold = (bayer[y % 4][x % 4] / 16) * 255;
      // Apply dither: if pixel is brighter than threshold, lighten; else darken
      const factor = gray > threshold ? 1.15 : 0.85;
      data[i] = Math.min(255, r * factor);
      data[i + 1] = Math.min(255, g * factor);
      data[i + 2] = Math.min(255, b * factor);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Apply selective blur to a region (used on filaments if needed)
// For now, we apply a global light blur via CSS filter on the canvas element,
// but we also support a programmatic blur on the canvas context.
function applyBlur(radius = 2) {
  // This is a placeholder for a potential selective blur.
  // The main blur effect is achieved via CSS:
  // canvas { filter: blur(1px); }
  // We add the CSS filter in Task 2 (style.css) but can also blur programmatically here if desired.
}

// Initialize
function initFlower() {
  resizeCanvas();
  drawFlower(1); // static for now; animation in next task
}

// Run
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlower);
} else {
  initFlower();
}

// Handle resize
window.addEventListener('resize', () => {
  resizeCanvas();
  drawFlower(1);
});
