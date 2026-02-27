const wrapper = document.getElementById('wrapper');
const photo   = document.getElementById('photo');
const badge   = document.getElementById('badge');

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_SCALE = 1;
const MAX_SCALE = 5;

// ─── State ────────────────────────────────────────────────────────────────────
let scale = 1;
let tx    = 0;   // translate X
let ty    = 0;   // translate Y

// Pinch state — snapshots taken at the START of each gesture
let pinchStartDist  = null;
let pinchStartScale = null;
let pinchStartMidX  = null;   // mid-point in wrapper coords at gesture start
let pinchStartMidY  = null;
let pinchStartTx    = null;   // translate at gesture start
let pinchStartTy    = null;

// Single-finger drag state
let dragPointerId = null;
let dragLastX     = null;
let dragLastY     = null;

// Double-tap detection
let lastTapTime = 0;
let lastTapX    = 0;
let lastTapY    = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTwoPointers() {
  // Returns the two active Touch objects for the current pinch
  // We keep a reference via the stored touches list
  return _currentTouches;
}

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
    Math.min(0, Math.max(cw  - s * cw,  x)),
    Math.min(0, Math.max(ch  - s * ch,  y)),
  ];
}

function applyTransform(snap = false) {
  if (snap) {
    photo.classList.add('snap');
  } else {
    photo.classList.remove('snap');
  }
  photo.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  badge.textContent = scale.toFixed(2) + '×';
}

// ─── Touch Start ──────────────────────────────────────────────────────────────
wrapper.addEventListener('touchstart', (e) => {
  e.preventDefault();
  _currentTouches = e.touches;

  if (e.touches.length === 2) {
    // ── Entering pinch ────────────────────────────────────────────────────
    // Cancel any ongoing drag
    dragPointerId = null;

    const [t1, t2] = [e.touches[0], e.touches[1]];
    const m = mid(t1, t2);

    // Snapshot everything at gesture START — this is the key to accuracy
    pinchStartDist  = dist(t1, t2);
    pinchStartScale = scale;
    pinchStartMidX  = m.x;
    pinchStartMidY  = m.y;
    pinchStartTx    = tx;
    pinchStartTy    = ty;

  } else if (e.touches.length === 1) {
    // ── Single finger — could be drag or tap ──────────────────────────────
    const t = e.touches[0];
    dragPointerId = t.identifier;
    dragLastX     = t.clientX;
    dragLastY     = t.clientY;
  }
}, { passive: false });

// ─── Touch Move ───────────────────────────────────────────────────────────────
let _currentTouches = [];

wrapper.addEventListener('touchmove', (e) => {
  e.preventDefault();
  _currentTouches = e.touches;

  if (e.touches.length === 2 && pinchStartDist !== null) {
    // ── Pinch zoom ────────────────────────────────────────────────────────
    const [t1, t2] = [e.touches[0], e.touches[1]];
    const currentDist = dist(t1, t2);
    const currentMid  = mid(t1, t2);

    // Scale ratio always relative to START — never frame-to-frame
    // This prevents jitter accumulation
    const scaleRatio = currentDist / pinchStartDist;
    const newScale   = Math.min(MAX_SCALE, Math.max(MIN_SCALE,
                         pinchStartScale * scaleRatio));

    // How much the midpoint has panned since gesture start
    const panX = currentMid.x - pinchStartMidX;
    const panY = currentMid.y - pinchStartMidY;

    // Recalculate translate so that pinchStartMid stays under fingers
    // Formula: newTx = startTx - startMidX*(newScale - startScale) + panX
    let newTx = pinchStartTx - pinchStartMidX * (newScale - pinchStartScale) + panX;
    let newTy = pinchStartTy - pinchStartMidY * (newScale - pinchStartScale) + panY;

    if (newScale <= MIN_SCALE) {
      newTx = 0;
      newTy = 0;
    } else {
      [newTx, newTy] = clamp(newTx, newTy, newScale);
    }

    scale = newScale;
    tx    = newTx;
    ty    = newTy;

    applyTransform();

  } else if (e.touches.length === 1 && scale > MIN_SCALE) {
    // ── Drag / pan ────────────────────────────────────────────────────────
    const t = Array.from(e.touches).find(t => t.identifier === dragPointerId);
    if (!t) return;

    tx += t.clientX - dragLastX;
    ty += t.clientY - dragLastY;
    dragLastX = t.clientX;
    dragLastY = t.clientY;

    [tx, ty] = clamp(tx, ty, scale);
    applyTransform();
  }
}, { passive: false });

// ─── Touch End ────────────────────────────────────────────────────────────────
wrapper.addEventListener('touchend', (e) => {
  e.preventDefault();
  _currentTouches = e.touches;

  // ── Double-tap detection ──────────────────────────────────────────────────
  if (e.changedTouches.length === 1 && e.touches.length === 0) {
    const t   = e.changedTouches[0];
    const now = Date.now();
    const dx  = t.clientX - lastTapX;
    const dy  = t.clientY - lastTapY;
    const sameSpot = Math.sqrt(dx * dx + dy * dy) < 30; // within 30px

    if (now - lastTapTime < 300 && sameSpot) {
      // Double tap — toggle between min and max
      const rect = wrapper.getBoundingClientRect();
      const cx   = t.clientX - rect.left;
      const cy   = t.clientY - rect.top;
      const midpoint = (MIN_SCALE + MAX_SCALE) / 2;

      if (scale >= midpoint) {
        // Zoom out to min
        scale = MIN_SCALE;
        tx = 0;
        ty = 0;
      } else {
        // Zoom in to max toward tap point
        const newScale = MAX_SCALE;
        tx = cx - (cx - tx) * (newScale / scale);
        ty = cy - (cy - ty) * (newScale / scale);
        scale = newScale;
        [tx, ty] = clamp(tx, ty, scale);
      }

      applyTransform(true); // snap animation
      lastTapTime = 0; // reset so 3rd tap doesn't re-trigger
      return;
    }

    lastTapTime = now;
    lastTapX    = t.clientX;
    lastTapY    = t.clientY;
  }

  // ── Reset pinch state when fingers lift ───────────────────────────────────
  if (e.touches.length < 2) {
    pinchStartDist  = null;
    pinchStartScale = null;
    pinchStartMidX  = null;
    pinchStartMidY  = null;
    pinchStartTx    = null;
    pinchStartTy    = null;
  }

  if (e.touches.length === 0) {
    dragPointerId = null;
  }
}, { passive: false });

wrapper.addEventListener('touchcancel', (e) => {
  pinchStartDist = null;
  dragPointerId  = null;
});