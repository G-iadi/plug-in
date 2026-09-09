import { FilesetResolver, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/+esm';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

function handSpan(pts) {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return Math.hypot(maxX - minX, maxY - minY);
}

function pinchOpenAmount(pts) {
  if (!pts?.[4] || !pts?.[8] || !pts?.[0] || !pts?.[9]) return null;
  if (handSpan(pts) < 0.1) return null;

  const pinch = Math.hypot(pts[8].x - pts[4].x, pts[8].y - pts[4].y);
  const handSize = Math.hypot(pts[0].x - pts[9].x, pts[0].y - pts[9].y);
  if (handSize < 0.04) return null;

  const ratio = pinch / handSize;
  return Math.max(0, Math.min(1, (ratio - 0.28) / 0.95));
}

function handLabel(handedness, index) {
  const item = handedness?.[index]?.[0];
  if (!item || item.score < 0.65) return '';
  return item.categoryName || '';
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const HAND_COLORS = {
  Right: '#ffe566',
  Left: '#fb7185',
  '': '#d4d4d8',
};

function syncMapSize(map, video) {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  if (map.width !== w || map.height !== h) {
    map.width = w;
    map.height = h;
  }
}

function drawHandMap(ctx, hands, handedness) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  hands.forEach((pts, i) => {
    const label = handedness?.[i]?.[0]?.categoryName || '';
    const color = HAND_COLORS[label] || HAND_COLORS[''];
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.lineCap = 'round';

    ctx.beginPath();
    HAND_CONNECTIONS.forEach(([a, b]) => {
      const pa = pts[a];
      const pb = pts[b];
      if (!pa || !pb) return;
      ctx.moveTo(pa.x * w, pa.y * h);
      ctx.lineTo(pb.x * w, pb.y * h);
    });
    ctx.stroke();

    const thumb = pts[4];
    const index = pts[8];
    if (thumb && index) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, w * 0.01);
      ctx.beginPath();
      ctx.moveTo(thumb.x * w, thumb.y * h);
      ctx.lineTo(index.x * w, index.y * h);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, Math.max(2.4, w * 0.008), 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

async function startHandTracking() {
  const video = document.getElementById('webcam');
  const map = document.getElementById('hand-map');
  const mapCtx = map?.getContext('2d');
  if (!video || !navigator.mediaDevices?.getUserMedia) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.warn('Webcam non disponibile', err);
    return;
  }

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  });

  let lastVideoTime = -1;

  function tick() {
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const result = handLandmarker.detectForVideo(video, performance.now());
      const hands = result.landmarks || [];

      if (map && mapCtx) {
        syncMapSize(map, video);
        drawHandMap(mapCtx, hands, result.handedness);
      }

      hands.forEach((pts, i) => {
        const label = handLabel(result.handedness, i);
        const open = pinchOpenAmount(pts);
        if (open == null) return;
        if (label === 'Right' && window.setHandInfluence) {
          window.setHandInfluence(open);
        }
        if (label === 'Left' && window.setHandTint) {
          window.setHandTint(open);
        }
      });
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

startHandTracking().catch((err) => {
  console.warn('Hand tracking non avviato', err);
});
