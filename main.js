const canvas = document.getElementById('flower-canvas');
const ctx = canvas?.getContext('2d');

if (!canvas || !ctx) {
  console.warn('Canvas not supported');
  document.body.classList.add('no-canvas');
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 720;

const BASE_ROT_X = 0.74;
const BASE_ROT_Y = -0.32;
const BASE_ROT_Z = (18 * Math.PI) / 180;
let ROT_X = BASE_ROT_X;
let ROT_Y = BASE_ROT_Y;
let ROT_Z = BASE_ROT_Z;
const PERSPECTIVE = 0.0026;
const SCALE = 2.95;

const BASE_LIGHT = { x: -0.78, y: 0.12, z: 0.58 };
const LIGHT = { ...BASE_LIGHT };

const COLORS = {
  bg: '#0a0a0f',
  sepalLit: '#c4b0d8',
  sepalMid: '#7a628f',
  sepalDark: '#2e2238',
  petalLit: '#fff8ff',
  petalMid: '#c4b0dc',
  petalDark: '#4a3658',
  coronaBase: '#3b0a5c',
  coronaBand: '#5b21b6',
  coronaMid: '#ddd6fe',
  coronaTip: '#1e1b4b',
  innerCorona: '#7c3aed',
  disk: '#2e1065',
  diskHot: '#6d28d9',
  column: '#e7e5e4',
  columnShade: '#78716c',
  ovary: '#86efac',
  ovaryShade: '#3f6212',
  style: '#fafaf9',
  stigma: '#44403c',
  filamentStamen: '#d6d3d1',
  anther: '#ffe566',
  antherEdge: '#ca8a04',
};

const LILAC_COLORS = { ...COLORS };

const MAGENTA_COLORS = {
  sepalLit: '#ffb7c8',
  sepalMid: '#e11d48',
  sepalDark: '#7f1d1d',
  petalLit: '#ffe4ec',
  petalMid: '#f43f5e',
  petalDark: '#9f1239',
  coronaBase: '#9f1239',
  coronaBand: '#e11d48',
  coronaMid: '#fecdd3',
  coronaTip: '#4c0519',
  innerCorona: '#fb7185',
  disk: '#881337',
  diskHot: '#fb7185',
};

const TINT_KEYS = Object.keys(MAGENTA_COLORS);

let tintAmount = 0;

function applyFlowerTint(amount) {
  const t = Math.max(0, Math.min(1, amount));
  TINT_KEYS.forEach((key) => {
    COLORS[key] = mixHex(LILAC_COLORS[key], MAGENTA_COLORS[key], t);
  });
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex({
    r: A.r + (B.r - A.r) * t,
    g: A.g + (B.g - A.g) * t,
    b: A.b + (B.b - A.b) * t,
  });
}

function resizeCanvas() {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

function clearCanvas() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function rotateZ(x, y, z) {
  const cz = Math.cos(ROT_Z);
  const sz = Math.sin(ROT_Z);
  return {
    x: x * cz - y * sz,
    y: x * sz + y * cz,
    z,
  };
}

function rotateZPt(p) {
  return rotateZ(p.x, p.y, p.z);
}

function project(x, y, z) {
  const p = rotateZ(x, y, z);
  const cy = Math.cos(ROT_Y);
  const sy = Math.sin(ROT_Y);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;

  const cx = Math.cos(ROT_X);
  const sx = Math.sin(ROT_X);
  const y2 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;

  const depth = 1 + z2 * PERSPECTIVE;
  return {
    x: ORIGIN.x + x1 * SCALE * depth,
    y: ORIGIN.y + y2 * SCALE * depth,
    z: z2,
    depth,
  };
}

const ORIGIN = { x: 0, y: 0 };

function sampleTepalBounds() {
  const structure = window.flowerStructure;
  if (!structure) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const consider = (pt) => {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  };

  [...structure.sepals, ...structure.petals].forEach((t) => {
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      consider(projectTepal(t.angle, u, -1, t.length, t.width, 1, t.lift));
      consider(projectTepal(t.angle, u, 1, t.length, t.width, 1, t.lift));
    }
  });

  return { minX, minY, maxX, maxY };
}

function setOrigin() {
  const liveX = ROT_X;
  const liveY = ROT_Y;
  const liveZ = ROT_Z;
  ROT_X = BASE_ROT_X;
  ROT_Y = BASE_ROT_Y;
  ROT_Z = BASE_ROT_Z;

  ORIGIN.x = 0;
  ORIGIN.y = 0;

  const bounds = sampleTepalBounds();
  if (bounds) {
    ORIGIN.x = 88 - bounds.minX;
    ORIGIN.y = 64 - bounds.minY;
  } else {
    ORIGIN.x = CANVAS_WIDTH * 0.55;
    ORIGIN.y = CANVAS_HEIGHT * 0.42;
  }

  ROT_X = liveX;
  ROT_Y = liveY;
  ROT_Z = liveZ;
}

function litAmount(nx, ny, nz, angle) {
  const len = Math.hypot(nx, ny, nz) || 1;
  const ndot = (nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z) / len;
  const facing = Math.cos(angle) * LIGHT.x + Math.sin(angle) * LIGHT.y;
  const wrap = 0.1 + 0.62 * Math.pow(Math.max(0, ndot), 1.25) + 0.28 * (facing * 0.5 + 0.5);
  return Math.max(0.06, Math.min(1, wrap));
}

function litColor(dark, mid, lit, amount) {
  if (amount < 0.45) return mixHex(dark, mid, amount / 0.45);
  return mixHex(mid, lit, (amount - 0.45) / 0.55);
}

function tepalPoint(angle, t, s, length, width, progress, lift) {
  const inner = 16 * progress;
  const len = length * progress;
  const r = inner + t * (len - inner);
  const flare = Math.sin(Math.PI * Math.min(1, t * 1.05)) * 0.92 + 0.08;
  const half = (width * progress * flare) / 2;
  const px = Math.cos(angle);
  const py = Math.sin(angle);
  const sx = -py;
  const sy = px;
  const x = px * r + sx * s * half;
  const y = py * r + sy * s * half;
  const cup = Math.sin(t * Math.PI) * lift * progress;
  const droop = t * t * 10 * progress;
  const z = cup - droop + 3 * progress;
  return { x, y, z };
}

function projectTepal(angle, t, s, length, width, progress, lift) {
  const p = tepalPoint(angle, t, s, length, width, progress, lift);
  return project(p.x, p.y, p.z);
}

function pathFromSamples(samples) {
  ctx.beginPath();
  samples.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();
}

function sampleTepalOutline(angle, length, width, progress, lift, zBias) {
  const left = [];
  const right = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = tepalPoint(angle, t, -1, length, width, progress, lift);
    const b = tepalPoint(angle, t, 1, length, width, progress, lift);
    left.push(project(a.x, a.y, a.z + zBias));
    right.push(project(b.x, b.y, b.z + zBias));
  }
  return left.concat(right.reverse());
}

function drawTepal(tepal, progress, palette) {
  if (progress <= 0) return;

  const { angle, length, width, lift } = tepal;
  const under = sampleTepalOutline(angle, length, width, progress, lift, -4);
  pathFromSamples(under);
  ctx.fillStyle = palette.dark;
  ctx.fill();

  const over = sampleTepalOutline(angle, length, width, progress, lift, 0);
  const a = rotateZPt(tepalPoint(angle, 0.2, -1, length, width, progress, lift));
  const b = rotateZPt(tepalPoint(angle, 0.55, 0, length, width, progress, lift));
  const c = rotateZPt(tepalPoint(angle, 0.2, 1, length, width, progress, lift));
  const nx = (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y);
  const ny = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
  const nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const amount = litAmount(nx, ny, nz, angle);
  const fill = litColor(palette.dark, palette.mid, palette.lit, amount);
  const shade = mixHex(palette.dark, fill, 0.22);
  const rim = mixHex(fill, palette.lit, 0.72 + amount * 0.28);

  const sx = -Math.sin(angle);
  const sy = Math.cos(angle);
  const lightAcross = LIGHT.x * sx + LIGHT.y * sy;
  const litEdge = projectTepal(angle, 0.48, lightAcross >= 0 ? 1 : -1, length, width, progress, lift);
  const darkEdge = projectTepal(angle, 0.48, lightAcross >= 0 ? -1 : 1, length, width, progress, lift);
  const grad = ctx.createLinearGradient(darkEdge.x, darkEdge.y, litEdge.x, litEdge.y);
  grad.addColorStop(0, shade);
  grad.addColorStop(0.38, fill);
  grad.addColorStop(1, rim);

  pathFromSamples(over);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = mixHex(palette.dark, fill, 0.35);
  ctx.lineWidth = 0.6;
  ctx.stroke();

  const rib = [];
  for (let i = 0; i <= 6; i++) {
    rib.push(projectTepal(angle, i / 6, 0, length, width, progress, lift));
  }
  ctx.strokeStyle = 'rgba(40, 28, 58, 0.28)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  rib.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
  ctx.stroke();

  const highlight = [];
  const hs = lightAcross >= 0 ? 0.52 : -0.52;
  for (let i = 1; i <= 5; i++) {
    highlight.push(projectTepal(angle, i / 6, hs, length, width, progress, lift));
  }
  ctx.strokeStyle = amount > 0.55 ? 'rgba(255, 255, 255, 0.38)' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  highlight.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
  ctx.stroke();
}

function drawCoronaRay(ray, progress) {
  if (progress <= 0) return;
  const inner = ray.innerR * progress;
  const outer = ray.outerR * progress;
  const start = project(
    Math.cos(ray.angle) * inner,
    Math.sin(ray.angle) * inner,
    4 * progress
  );
  const end = project(
    Math.cos(ray.angle) * outer,
    Math.sin(ray.angle) * outer,
    (6 + ray.wave) * progress
  );
  const midR = (inner + outer) * 0.5;
  const cp = project(
    Math.cos(ray.angle + ray.curveBias) * midR,
    Math.sin(ray.angle + ray.curveBias) * midR,
    (8 + ray.wave) * progress
  );

  const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
  grad.addColorStop(0, COLORS.coronaBase);
  grad.addColorStop(0.22, COLORS.coronaBand);
  grad.addColorStop(0.48, COLORS.coronaMid);
  grad.addColorStop(0.74, COLORS.coronaBand);
  grad.addColorStop(1, COLORS.coronaTip);

  ctx.strokeStyle = grad;
  ctx.lineWidth = ray.width * end.depth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
  ctx.stroke();
}

function drawInnerCorona(ray, progress) {
  if (progress <= 0) return;
  const start = project(
    Math.cos(ray.angle) * ray.innerR * progress,
    Math.sin(ray.angle) * ray.innerR * progress,
    6 * progress
  );
  const end = project(
    Math.cos(ray.angle) * ray.outerR * progress,
    Math.sin(ray.angle) * ray.outerR * progress,
    10 * progress
  );
  ctx.strokeStyle = COLORS.innerCorona;
  ctx.lineWidth = 1.05 * end.depth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function drawProjectedDisk(radius, z, progress, inner, outer) {
  const r = radius * progress;
  if (r <= 0) return;
  const center = project(0, 0, z * progress);
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const p = project(Math.cos(a) * r, Math.sin(a) * r, z * progress);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(center.x, center.y, r * 0.12, center.x, center.y, r * 1.1);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawColumnSegment(from, to, w0, w1, fill) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len);
  const ny = dx / len;
  ctx.beginPath();
  ctx.moveTo(from.x + nx * w0, from.y + ny * w0);
  ctx.lineTo(to.x + nx * w1, to.y + ny * w1);
  ctx.lineTo(to.x - nx * w1, to.y - ny * w1);
  ctx.lineTo(from.x - nx * w0, from.y - ny * w0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawAndrogynophore(progress) {
  const h = 34 * progress;
  if (h <= 2) return;
  const base = project(0, 0, 5 * progress);
  const top = project(0, 0, h);
  const mid = project(0, 0, h * 0.55);
  drawColumnSegment(base, mid, 3.4 * progress, 2.6 * progress, COLORS.columnShade);
  drawColumnSegment(mid, top, 2.6 * progress, 2.1 * progress, COLORS.column);

  const ovaryR = 6.2 * progress;
  const ovary = project(0, 0, h + 3 * progress);
  const og = ctx.createRadialGradient(ovary.x - 1.4, ovary.y - 1.6, 0.4, ovary.x, ovary.y, ovaryR * ovary.depth);
  og.addColorStop(0, COLORS.ovary);
  og.addColorStop(1, COLORS.ovaryShade);
  ctx.fillStyle = og;
  ctx.beginPath();
  ctx.ellipse(ovary.x, ovary.y, ovaryR * ovary.depth * 1.05, ovaryR * ovary.depth * 0.82, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawStamen(stamen, progress) {
  if (progress < 0.42) return;
  const p = (progress - 0.42) / 0.58;
  const origin = project(0, 0, 18 * progress);
  const reach = 20 * p;
  const hang = 8 * p;
  const tip = project(
    Math.cos(stamen.angle) * reach,
    Math.sin(stamen.angle) * reach,
    16 * progress - hang
  );
  ctx.strokeStyle = COLORS.filamentStamen;
  ctx.lineWidth = 1.15 * tip.depth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.quadraticCurveTo(
    (origin.x + tip.x) / 2,
    (origin.y + tip.y) / 2 + 4 * p,
    tip.x,
    tip.y
  );
  ctx.stroke();

  ctx.fillStyle = COLORS.anther;
  ctx.strokeStyle = COLORS.antherEdge;
  ctx.lineWidth = 0.55;
  const aw = 7.8 * p * tip.depth;
  const ah = 3.6 * p * tip.depth;
  ctx.beginPath();
  ctx.ellipse(tip.x, tip.y, aw, ah, stamen.angle * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(tip.x + Math.cos(stamen.angle) * aw * 0.55, tip.y + Math.sin(stamen.angle) * ah * 0.35, aw * 0.72, ah * 0.85, stamen.angle * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawStyle(style, progress) {
  if (progress < 0.52) return;
  const p = (progress - 0.52) / 0.48;
  const origin = project(0, 0, 38 * progress);
  const len = 18 * p;
  const tip = project(
    Math.cos(style.angle) * len,
    Math.sin(style.angle) * len,
    44 * progress
  );
  ctx.strokeStyle = COLORS.style;
  ctx.lineWidth = 1.35 * tip.depth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.quadraticCurveTo(
    (origin.x + tip.x) / 2,
    origin.y - 6 * p,
    tip.x,
    tip.y
  );
  ctx.stroke();

  ctx.fillStyle = COLORS.stigma;
  ctx.beginPath();
  ctx.ellipse(tip.x, tip.y, 3.3 * p * tip.depth, 2.1 * p * tip.depth, style.angle, 0, Math.PI * 2);
  ctx.fill();
}

function generateFlowerStructure() {
  const sepals = [];
  const petals = [];
  const corona = [];
  const innerCorona = [];
  const stamens = [];
  const styles = [];

  for (let i = 0; i < 5; i++) {
    const base = (Math.PI * 2 / 5) * i + 0.35;
    sepals.push({
      angle: base + (Math.random() - 0.5) * 0.1,
      length: 90 + Math.random() * 12,
      width: 36 + Math.random() * 8,
      lift: 16 + Math.random() * 6,
    });
    petals.push({
      angle: base + Math.PI / 5 + (Math.random() - 0.5) * 0.1,
      length: 96 + Math.random() * 10,
      width: 34 + Math.random() * 7,
      lift: 20 + Math.random() * 8,
    });
  }

  for (let i = 0; i < 68; i++) {
    corona.push({
      angle: (Math.PI * 2 / 68) * i + (Math.random() - 0.5) * 0.05,
      innerR: 15 + Math.random() * 2,
      outerR: 52 + Math.random() * 16,
      curveBias: (Math.random() - 0.5) * 0.1,
      width: 0.85 + Math.random() * 0.45,
      wave: (Math.random() - 0.5) * 6,
    });
  }

  for (let i = 0; i < 32; i++) {
    innerCorona.push({
      angle: (Math.PI * 2 / 32) * i,
      innerR: 13,
      outerR: 24 + Math.random() * 5,
    });
  }

  for (let i = 0; i < 5; i++) {
    stamens.push({ angle: (Math.PI * 2 / 5) * i + 0.5 });
  }
  for (let i = 0; i < 3; i++) {
    styles.push({ angle: (Math.PI * 2 / 3) * i - 0.4 });
  }

  return { sepals, petals, corona, innerCorona, stamens, styles };
}

function depthOfTepal(t, progress) {
  return projectTepal(t.angle, 0.55, 0, t.length, t.width, progress, t.lift).z;
}

function drawFlower(progress) {
  clearCanvas();

  if (!window.flowerStructure) {
    window.flowerStructure = generateFlowerStructure();
  }
  setOrigin();
  const { sepals, petals, corona, innerCorona, stamens, styles } = window.flowerStructure;

  const tepals = [
    ...sepals.map((t) => ({ ...t, kind: 'sepal' })),
    ...petals.map((t) => ({ ...t, kind: 'petal' })),
  ].sort((a, b) => depthOfTepal(a, progress) - depthOfTepal(b, progress));

  tepals.forEach((t) => {
    const palette = t.kind === 'sepal'
      ? { dark: COLORS.sepalDark, mid: COLORS.sepalMid, lit: COLORS.sepalLit }
      : { dark: COLORS.petalDark, mid: COLORS.petalMid, lit: COLORS.petalLit };
    drawTepal(t, progress, palette);
  });

  [...corona].sort((a, b) => {
    const za = project(Math.cos(a.angle) * a.outerR, Math.sin(a.angle) * a.outerR, 6).z;
    const zb = project(Math.cos(b.angle) * b.outerR, Math.sin(b.angle) * b.outerR, 6).z;
    return za - zb;
  }).forEach((f) => drawCoronaRay(f, progress));

  innerCorona.forEach((f) => drawInnerCorona(f, progress));
  drawProjectedDisk(15, 4, progress, COLORS.diskHot, COLORS.disk);
  drawAndrogynophore(progress);
  styles.forEach((s) => drawStyle(s, progress));
  stamens.forEach((s) => drawStamen(s, progress));
}

let sourcePixels = null;
let bloomDone = false;
let animId = 0;
let handGeomDirty = false;
let fillAmount = 0;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function captureSource() {
  sourcePixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function hash2(x, y) {
  let n = Math.imul(x * 374761393 + y * 668265263, 1597334677);
  n = (n ^ (n >>> 13)) >>> 0;
  return n / 4294967295;
}

function pixelAt(src, w, h, x, y) {
  const sx = Math.max(0, Math.min(w - 1, x | 0));
  const sy = Math.max(0, Math.min(h - 1, y | 0));
  const i = (sy * w + sx) * 4;
  return { r: src[i], g: src[i + 1], b: src[i + 2] };
}

function isBg(r, g, b) {
  return r < 22 && g < 22 && b < 30;
}

function isYellow(r, g, b) {
  return r > 170 && g > 130 && b < 120 && r + g > b * 3.2;
}

function samplePresence(src, w, h, x, y) {
  const { r, g, b } = pixelAt(src, w, h, x, y);
  if (isBg(r, g, b)) return { presence: 0, r, g, b, yellow: false };

  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  const yellow = isYellow(r, g, b);

  const n1 = pixelAt(src, w, h, x + 2, y);
  const n2 = pixelAt(src, w, h, x - 2, y);
  const n3 = pixelAt(src, w, h, x, y + 2);
  const n4 = pixelAt(src, w, h, x, y - 2);
  const grad =
    (Math.abs(n1.r - n2.r) + Math.abs(n1.g - n2.g) + Math.abs(n1.b - n2.b) +
      Math.abs(n3.r - n4.r) + Math.abs(n3.g - n4.g) + Math.abs(n3.b - n4.b)) / 6 / 255;

  const presence = Math.min(1, Math.max(luma, chroma * 0.9, grad * 1.35, yellow ? 0.95 : 0));
  return { presence, luma, r, g, b, yellow };
}

function stampDot(dst, w, h, cx, cy, radius, r, g, b) {
  const rad = Math.max(0.65, radius);
  const r2 = rad * rad;
  const minX = Math.max(0, Math.floor(cx - rad));
  const maxX = Math.min(w - 1, Math.ceil(cx + rad));
  const minY = Math.max(0, Math.floor(cy - rad));
  const maxY = Math.min(h - 1, Math.ceil(cy + rad));
  const incoming = r + g + b;
  const incomingYellow = isYellow(r, g, b);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > r2) continue;
      const i = (y * w + x) * 4;
      const existingYellow = isYellow(dst[i], dst[i + 1], dst[i + 2]);
      if (existingYellow && !incomingYellow) continue;
      if (!incomingYellow) {
        const existing = dst[i] + dst[i + 1] + dst[i + 2];
        if (incoming < existing) continue;
      }
      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
      dst[i + 3] = 255;
    }
  }
}

function putSolidFlower() {
  const w = canvas.width;
  const h = canvas.height;
  const out = ctx.createImageData(w, h);
  const dst = out.data;
  const src = sourcePixels.data;
  for (let i = 0; i < dst.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    if (isBg(r, g, b)) {
      dst[i + 3] = 0;
      continue;
    }
    dst[i] = r;
    dst[i + 1] = g;
    dst[i + 2] = b;
    dst[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
}

function applyDither(src, now = 0) {
  const w = canvas.width;
  const h = canvas.height;
  const fill = Math.max(0, Math.min(1, fillAmount));

  if (fill >= 0.96 && sourcePixels) {
    putSolidFlower();
    return;
  }

  const imageData = ctx.createImageData(w, h);
  const dst = imageData.data;
  const motion = !prefersReducedMotion();
  const drift = motion ? now * 0.0016 : 0;

  const minCell = Math.max(1.8, 3.4 - fill * 2.3);
  const jitter = 0.4 * (1 - fill * 0.75);
  const wobbleAmp = motion ? 0.22 * (1 - fill) : 0;

  for (let y = minCell * 0.5; y < h; y += minCell) {
    const row = Math.round(y / minCell);
    const hex = (row % 2) * minCell * 0.5;
    for (let x = minCell * 0.5 + hex; x < w; x += minCell) {
      const { presence, luma, r, g, b, yellow } = samplePresence(src, w, h, x, y);
      if (presence < 0.07) continue;

      const jx = (hash2(row, Math.round(x)) - 0.5) * minCell * jitter;
      const jy = (hash2(Math.round(x) + 9, row) - 0.5) * minCell * jitter;
      const wobbleX = Math.sin(drift + row * 0.35) * wobbleAmp;
      const wobbleY = Math.cos(drift * 0.85 + x * 0.02) * wobbleAmp;
      const cx = x + jx + wobbleX;
      const cy = y + jy + wobbleY;

      const gate = hash2(Math.round(cx * 3), Math.round(cy * 3));
      let keepChance = yellow ? 0.92 : 0.2 + 0.42 * presence;
      keepChance = keepChance + (1 - keepChance) * fill;
      if (gate > keepChance) continue;

      const pulse = motion ? 1 + Math.sin(drift * 0.9 + row * 0.25) * 0.03 * (1 - fill) : 1;
      const radius = (yellow
        ? 1.7 + luma * 1.4
        : 0.65 + luma * luma * 2.35 + presence * 0.35) * pulse * (1 + fill * 1.65);
      const avg = (r + g + b) / 3;
      const sat = yellow ? 1.7 : 1.45;
      stampDot(
        dst,
        w,
        h,
        cx,
        cy,
        radius,
        Math.min(255, avg + (r - avg) * sat),
        Math.min(255, avg + (g - avg) * sat),
        Math.min(255, avg + (b - avg) * sat)
      );
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function renderGeometry(progress) {
  drawFlower(progress);
  captureSource();
}

function startAnimation() {
  cancelAnimationFrame(animId);
  bloomDone = false;
  const startTime = performance.now();
  const duration = prefersReducedMotion() ? 0 : 2500;

  function frame(now) {
    if (!bloomDone) {
      const elapsed = now - startTime;
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      renderGeometry(eased);
      if (progress >= 1) bloomDone = true;
    } else if (handGeomDirty) {
      renderGeometry(1);
      handGeomDirty = false;
    }

    if (sourcePixels) {
      applyDither(sourcePixels.data, now);
    }

    animId = requestAnimationFrame(frame);
  }

  animId = requestAnimationFrame(frame);
}

function pinchClosed(openAmount) {
  const open = Number(openAmount);
  if (!Number.isFinite(open)) return null;
  return 1 - Math.max(0, Math.min(1, open));
}

function setHandInfluence(openAmount) {
  const closed = pinchClosed(openAmount);
  if (closed == null) return;
  fillAmount = Math.max(0, Math.min(1, fillAmount + (closed - fillAmount) * 0.18));
}

function setHandTint(openAmount) {
  const closed = pinchClosed(openAmount);
  if (closed == null) return;
  const next = tintAmount + (closed - tintAmount) * 0.16;
  if (Math.abs(next - tintAmount) < 0.004) return;
  tintAmount = Math.max(0, Math.min(1, next));
  applyFlowerTint(tintAmount);
  if (bloomDone) handGeomDirty = true;
}

window.setHandInfluence = setHandInfluence;
window.setHandTint = setHandTint;

window.addEventListener('keydown', (event) => {
  if (event.key === '+' || event.key === '=') {
    fillAmount = Math.min(1, fillAmount + 0.08);
  } else if (event.key === '-' || event.key === '_') {
    fillAmount = Math.max(0, fillAmount - 0.08);
  }
});

function initFlower() {
  resizeCanvas();
  startAnimation();
}

if (canvas && ctx) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFlower);
  } else {
    initFlower();
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
      bloomDone = true;
      renderGeometry(1);
      if (prefersReducedMotion() && sourcePixels) {
        applyDither(sourcePixels.data, 0);
      }
    }, 100);
  });
}
