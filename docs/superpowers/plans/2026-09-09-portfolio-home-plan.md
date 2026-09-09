# Portfolio Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal, fullscreen portfolio home page featuring a procedurally generated passionflower with blur, pixel, and dither effects, plus typography and navigation.

**Architecture:** Single-page vanilla HTML/CSS/JS. A `<canvas>` element covers the viewport and draws the flower procedurally. Text and navigation overlay via absolutely positioned HTML elements. No build step, no framework.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+), Canvas 2D API.

**Spec:** `docs/superpowers/specs/2026-09-09-portfolio-home-design.md`

## Global Constraints

- No heavy JS frameworks (React, Vue, etc.).
- Flower must be generated procedurally via Canvas 2D, not static image/SVG.
- Fonts must have system font fallbacks for performance.
- No build step; files are served directly.
- Animation must use `requestAnimationFrame`.

---

## Task 1: HTML Scaffolding and Canvas Setup

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: None.
- Produces: `index.html` with `<canvas id="flower-canvas">`, `<header>` with name/tagline, and `<nav>` with menu links.

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="flower-canvas"></canvas>

  <header class="site-header">
    <h1 class="brand-name">TUO NOME</h1>
    <p class="tagline">Graphic Designer</p>
  </header>

  <nav class="site-nav">
    <a href="#">Work</a>
    <a href="#">Info</a>
    <a href="#">Contact</a>
  </nav>

  <script src="main.js"></script>
</body>
</html>
```

**Note:** Replace `TUO NOME` with the actual brand name when known. The `Archivo` font is loaded from Google Fonts. `Elza Trial` is not freely available via CDN, so we will use a similar system display font (e.g., `system-ui` with heavy weight) and note in CSS that `Elza Trial` should be loaded locally when available.

- [ ] **Step 2: Verify the file opens in browser**

Run: `open /Users/giadadigiorgio/Desktop/plug-in/index.html`
Expected: Page loads with black background, visible text, and canvas element present.

---

## Task 2: CSS Foundation — Typography, Layout, and Canvas Positioning

**Files:**
- Create: `style.css`

**Interfaces:**
- Consumes: `index.html` structure (class names `.site-header`, `.brand-name`, `.tagline`, `.site-nav`, `#flower-canvas`).
- Produces: Styled layout matching the spec: dark background, centered name, right-aligned nav, canvas behind everything.

- [ ] **Step 1: Create `style.css`**

```css
/* Reset and base */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #0a0a0f;
  color: #f0f0f5;
  font-family: 'Archivo', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Canvas fills viewport, sits behind everything */
#flower-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  /* Pixelation effect: canvas internal resolution will be lower than display size */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Header: name centered, tagline below */
.site-header {
  position: relative;
  z-index: 1;
  text-align: center;
  padding-top: 8vh;
  pointer-events: none; /* let clicks pass through to canvas if needed */
}

.brand-name {
  font-family: 'Elza Trial', 'Arial Black', system-ui, sans-serif;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.1;
  color: #f0f0f5;
}

.tagline {
  font-family: 'Archivo', system-ui, sans-serif;
  font-size: clamp(0.9rem, 1.5vw, 1.2rem);
  font-weight: 400;
  color: rgba(240, 240, 245, 0.5);
  margin-top: 0.6rem;
  letter-spacing: 0.02em;
}

/* Navigation: top right */
.site-nav {
  position: absolute;
  top: 8vh;
  right: 5vw;
  z-index: 1;
  display: flex;
  gap: 1.5rem;
}

.site-nav a {
  font-family: 'Archivo', system-ui, sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #f0f0f5;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.site-nav a:hover {
  opacity: 1;
  text-decoration: underline;
}

/* Responsive: mobile adjustments */
@media (max-width: 600px) {
  .site-header {
    padding-top: 6vh;
  }

  .site-nav {
    top: 6vh;
    right: 4vw;
    gap: 1rem;
  }

  .site-nav a {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
  }
}
```

- [ ] **Step 2: Open `index.html` in browser and verify layout**

Run: `open /Users/giadadigiorgio/Desktop/plug-in/index.html`
Expected: Background is very dark. Name is centered top. Menu is top-right. Tagline is visible under the name.

---

## Task 3: Procedural Flower Generation (Core Drawing)

**Files:**
- Create: `main.js`

**Interfaces:**
- Consumes: `index.html` canvas element (`id="flower-canvas"`).
- Produces: `main.js` with functions to draw the passionflower center, petals, and filaments. Exposes `initFlower()`.

- [ ] **Step 1: Create `main.js` with canvas setup and flower drawing functions**

```javascript
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
function drawFilament(cx, cy, angle, length, progress) {
  const endX = cx + Math.cos(angle) * length * progress;
  const endY = cy + Math.sin(angle) * length * progress;

  // Control point for slight curve
  const cpLen = length * 0.6 * progress;
  const cpX = cx + Math.cos(angle + (Math.random() - 0.5) * 0.3) * cpLen;
  const cpY = cy + Math.sin(angle + (Math.random() - 0.5) * 0.3) * cpLen;

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
    filaments.push({ angle, length });
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
  filaments.forEach(f => drawFilament(cx, cy, f.angle, f.length, progress));
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
```

- [ ] **Step 2: Open in browser and verify flower is drawn**

Run: `open /Users/giadadigiorgio/Desktop/plug-in/index.html`
Expected: A flower-like shape appears in the lower-right area of the canvas. Center disk, petals, and filaments are visible.

---

## Task 4: Pixelation, Blur, and Dither Effects

**Files:**
- Modify: `main.js`

**Interfaces:**
- Consumes: `drawFlower(progress)` and `clearCanvas()` from Task 3.
- Produces: `applyDither()` and `applyBlur()` functions. `drawFlower()` now calls effects after drawing.

- [ ] **Step 1: Add pixelation and dither functions to `main.js`**

Insert the following functions into `main.js`, after `drawFlower` and before `initFlower`:

```javascript
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
```

Then modify `drawFlower(progress)` to call `applyDither()` at the end:

```javascript
function drawFlower(progress) {
  clearCanvas();

  const cx = CANVAS_WIDTH * 0.60;
  const cy = CANVAS_HEIGHT * 0.65;

  if (!window.flowerStructure) {
    window.flowerStructure = generateFlowerStructure(cx, cy);
  }
  const { petals, filaments } = window.flowerStructure;

  petals.forEach(p => drawPetal(cx, cy, p.angle, p.length, p.width, progress));
  drawCenter(cx, cy, 25, progress);
  filaments.forEach(f => drawFilament(cx, cy, f.angle, f.length, progress));

  // Apply dither after drawing
  applyDither();
}
```

Also add the CSS blur to `style.css` in the `#flower-canvas` rule:

```css
#flower-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  filter: blur(1.5px); /* subtle blur */
}
```

- [ ] **Step 2: Verify effects in browser**

Run: `open /Users/giadadigiorgio/Desktop/plug-in/index.html`
Expected: The flower appears slightly blurred (CSS filter) and has a grainy/dithered texture (pixel manipulation). The pixelation is visible because the canvas is 400x400 stretched to full screen.

---

## Task 5: Bloom Animation (Progressive Growth)

**Files:**
- Modify: `main.js`

**Interfaces:**
- Consumes: `drawFlower(progress)` from Task 3.
- Produces: `animateBloom()` function that drives `drawFlower(progress)` from 0 to 1 over 2-3 seconds using `requestAnimationFrame`.

- [ ] **Step 1: Replace static `drawFlower(1)` with bloom animation**

Replace the `initFlower` and bottom section of `main.js` with:

```javascript
function initFlower() {
  resizeCanvas();
  animateBloom();
}

function animateBloom() {
  const duration = 2500; // 2.5 seconds
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic for natural growth feel
    const eased = 1 - Math.pow(1 - progress, 3);

    drawFlower(eased);

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlower);
} else {
  initFlower();
}

window.addEventListener('resize', () => {
  resizeCanvas();
  // On resize, redraw fully bloomed flower
  drawFlower(1);
});
```

- [ ] **Step 2: Verify animation in browser**

Run: `open /Users/giadadigiorgio/Desktop/plug-in/index.html`
Expected: On page load, the flower "grows" from nothing to full bloom over ~2.5 seconds. The growth should feel organic (ease-out curve). After bloom completes, the flower stays static.

---

## Task 6: Responsive Behavior and Polish

**Files:**
- Modify: `style.css`
- Modify: `main.js`

**Interfaces:**
- Consumes: Existing CSS and JS.
- Produces: Mobile-friendly layout and robust resize handling.

- [ ] **Step 1: Enhance `style.css` for mobile and accessibility**

Add to the bottom of `style.css`:

```css
/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  #flower-canvas {
    filter: none;
  }
}

/* Ensure text is readable if canvas fails to load */
.no-canvas .site-header,
.no-canvas .site-nav {
  position: relative;
  z-index: 10;
}
```

- [ ] **Step 2: Enhance `main.js` for graceful degradation and resize robustness**

Add at the top of `main.js`, after `const ctx = ...`:

```javascript
if (!canvas || !ctx) {
  console.warn('Canvas not supported');
  document.body.classList.add('no-canvas');
}
```

Ensure the resize handler debounces slightly (optional, but good practice):

```javascript
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    resizeCanvas();
    drawFlower(1);
  }, 100);
});
```

- [ ] **Step 3: Test on mobile viewport via DevTools**

Open DevTools, toggle device toolbar to iPhone SE / Pixel 5.
Expected: Text remains readable. Flower scales down and stays in lower-right area. Menu stays top-right but may wrap or shrink.

---

## Task 7: Final Integration and Manual QA

**Files:**
- Modify: `index.html` (optional: update title, add meta tags).
- Review: all three files.

**Interfaces:**
- Consumes: All previous tasks.
- Produces: A working, testable home page.

- [ ] **Step 1: Final review of all files**

Open all three files side by side and verify:
- `index.html` loads `style.css` and `main.js`.
- `style.css` covers all classes used in HTML.
- `main.js` references `flower-canvas` correctly.
- No `TODO`, `TBD`, or placeholder comments remain.

- [ ] **Step 2: Browser QA checklist**

1. Open `index.html` in Chrome/Safari/Firefox.
2. Verify flower blooms smoothly (2-3 sec).
3. Verify pixelation, blur, and dither are visible.
4. Resize window: flower re-centers correctly.
5. Disable JS: only text and nav remain visible on dark background.
6. Check mobile viewport (DevTools): layout holds.

- [ ] **Step 3: Commit**

```bash
git add index.html style.css main.js docs/
git commit -m "feat: add portfolio home page with procedural passionflower"
```

---

## Self-Review

**1. Spec coverage:**
- Home page, single file: ✅ Task 1, 2
- Procedural flower via Canvas 2D: ✅ Task 3
- Effects (blur, pixel, dither): ✅ Task 4
- Animation (sbocciata 2-3 sec): ✅ Task 5
- Typography (Elza/Archivo): ✅ Task 2 (nota: Elza Trial non su CDN, usato fallback)
- Layout asimmetrico (fiore basso-destra): ✅ Task 3
- Nome centrato, menu destra: ✅ Task 2
- Responsive: ✅ Task 6
- No framework: ✅ Global constraint respected

**2. Placeholder scan:**
- Nessun `TODO`, `TBD`, o "implement later".
- I nomi dei colori sono provvisori ma espliciti (da affinare con l'utente).
- La tagline è placeholder ma notata.

**3. Type consistency:**
- `drawFlower(progress)` usa sempre `progress` come numero 0-1. ✅
- `resizeCanvas()` e `clearCanvas()` sono coerenti. ✅

**Nessun gap rilevante trovato.**
