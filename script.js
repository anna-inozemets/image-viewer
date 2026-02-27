const wrapper = document.getElementById('wrapper');
const photo   = document.getElementById('photo');
const badge   = document.getElementById('badge');

const MIN_SCALE = 1;
const MAX_SCALE = 5;

/* ─────────────────────────────────────────────
   Transform state
───────────────────────────────────────────── */

let scale = 1;
let tx = 0;
let ty = 0;

/* ─────────────────────────────────────────────
   Pinch snapshot state (НЕ ТРОГАЕМ ЛОГИКУ)
───────────────────────────────────────────── */

let pinchStartDist  = null;
let pinchStartScale = null;
let pinchStartMidX  = null;
let pinchStartMidY  = null;
let pinchStartTx    = null;
let pinchStartTy    = null;

/* ─────────────────────────────────────────────
   Unified drag snapshot state
───────────────────────────────────────────── */

let dragStartX  = null;
let dragStartY  = null;
let dragStartTx = null;
let dragStartTy = null;

/* ─────────────────────────────────────────────
   Double tap
───────────────────────────────────────────── */

let lastTapTime = 0;
let lastTapX    = 0;
let lastTapY    = 0;

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function dist(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function mid(t1, t2) {
  const rect = wrapper.getBoundingClientRect();
  return {
    x: (t1.clientX + t2.clientX) / 2 - rect.left,
    y: (t1.clientY + t2.clientY) / 2 - rect.top,
  };
}

function clamp(x, y, s) {
  const cw = wrapper.clientWidth;
  const ch = wrapper.clientHeight;

  return [
    Math.min(0, Math.max(cw - s * cw, x)),
    Math.min(0, Math.max(ch - s * ch, y)),
  ];
}

function applyTransform(snap = false) {
  photo.classList.toggle('snap', snap);
  photo.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  if (badge) {
    badge.textContent = scale.toFixed(2) + '×';
  }
}

/* ─────────────────────────────────────────────
   Core utilities
───────────────────────────────────────────── */

function zoomAt(cx, cy, newScale, snap = false) {
  newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
  if (newScale === scale) return;

  tx = cx - (cx - tx) * (newScale / scale);
  ty = cy - (cy - ty) * (newScale / scale);

  scale = newScale;

  if (scale <= MIN_SCALE) {
    tx = 0;
    ty = 0;
  } else {
    [tx, ty] = clamp(tx, ty, scale);
  }

  applyTransform(snap);
}

function resetZoom(snap = false) {
  scale = MIN_SCALE;
  tx = 0;
  ty = 0;
  applyTransform(snap);
}

function toggleZoomAt(cx, cy) {
  const midpoint = (MIN_SCALE + MAX_SCALE) / 2;
  if (scale >= midpoint) {
    resetZoom(true);
  } else {
    zoomAt(cx, cy, MAX_SCALE, true);
  }
}

/* ─────────────────────────────────────────────
   Unified drag engine (snapshot-based)
───────────────────────────────────────────── */

function startDrag(clientX, clientY) {
  if (scale <= MIN_SCALE) return;

  dragStartX  = clientX;
  dragStartY  = clientY;
  dragStartTx = tx;
  dragStartTy = ty;
}

function moveDrag(clientX, clientY) {
  if (dragStartX === null) return;

  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;

  let newTx = dragStartTx + dx;
  let newTy = dragStartTy + dy;

  [newTx, newTy] = clamp(newTx, newTy, scale);

  tx = newTx;
  ty = newTy;

  applyTransform();
}

function endDrag() {
  dragStartX = null;
}

/* ─────────────────────────────────────────────
   TOUCH EVENTS
───────────────────────────────────────────── */

wrapper.addEventListener('touchstart', (e) => {
  e.preventDefault();

  if (e.touches.length === 2) {
    endDrag();

    const [t1, t2] = [e.touches[0], e.touches[1]];
    const m = mid(t1, t2);

    pinchStartDist  = dist(t1, t2);
    pinchStartScale = scale;
    pinchStartMidX  = m.x;
    pinchStartMidY  = m.y;
    pinchStartTx    = tx;
    pinchStartTy    = ty;

  } else if (e.touches.length === 1) {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }
}, { passive: false });

wrapper.addEventListener('touchmove', (e) => {
  e.preventDefault();

  if (e.touches.length === 2 && pinchStartDist !== null) {

    const [t1, t2] = [e.touches[0], e.touches[1]];
    const currentDist = dist(t1, t2);
    const currentMid  = mid(t1, t2);

    const scaleRatio = currentDist / pinchStartDist;
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, pinchStartScale * scaleRatio)
    );

    const panX = currentMid.x - pinchStartMidX;
    const panY = currentMid.y - pinchStartMidY;

    let newTx = pinchStartTx - pinchStartMidX * (newScale - pinchStartScale) + panX;
    let newTy = pinchStartTy - pinchStartMidY * (newScale - pinchStartScale) + panY;

    if (newScale <= MIN_SCALE) {
      newTx = 0;
      newTy = 0;
    } else {
      [newTx, newTy] = clamp(newTx, newTy, newScale);
    }

    scale = newScale;
    tx = newTx;
    ty = newTy;

    applyTransform();

  } else if (e.touches.length === 1) {
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  }
}, { passive: false });

wrapper.addEventListener('touchend', (e) => {
  e.preventDefault();

  /* Double tap */
  if (e.changedTouches.length === 1 && e.touches.length === 0) {
    const t = e.changedTouches[0];
    const now = Date.now();

    const dx = t.clientX - lastTapX;
    const dy = t.clientY - lastTapY;
    const sameSpot = Math.sqrt(dx * dx + dy * dy) < 30;

    if (now - lastTapTime < 300 && sameSpot) {
      const rect = wrapper.getBoundingClientRect();
      toggleZoomAt(
        t.clientX - rect.left,
        t.clientY - rect.top
      );
      lastTapTime = 0;
      return;
    }

    lastTapTime = now;
    lastTapX = t.clientX;
    lastTapY = t.clientY;
  }

  if (e.touches.length < 2) {
    pinchStartDist = null;
  }

  if (e.touches.length === 0) {
    endDrag();
  }
}, { passive: false });

wrapper.addEventListener('touchcancel', () => {
  pinchStartDist = null;
  endDrag();
});

/* ─────────────────────────────────────────────
   MOUSE EVENTS
───────────────────────────────────────────── */

wrapper.addEventListener('mousedown', (e) => {
  startDrag(e.clientX, e.clientY);
});

window.addEventListener('mousemove', (e) => {
  moveDrag(e.clientX, e.clientY);
});

window.addEventListener('mouseup', endDrag);

wrapper.addEventListener('wheel', (e) => {
  e.preventDefault();

  const rect = wrapper.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  const zoomIntensity = 0.01;
  const delta = -e.deltaY * zoomIntensity;

  zoomAt(cx, cy, scale * (1 + delta));
}, { passive: false });

wrapper.addEventListener('dblclick', (e) => {
  const rect = wrapper.getBoundingClientRect();
  toggleZoomAt(
    e.clientX - rect.left,
    e.clientY - rect.top
  );
});