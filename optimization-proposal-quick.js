// БЫСТРЫЕ ОПТИМИЗАЦИИ для script.js

// 1. Оптимизация интервала пересчетов
const RECOMPUTE_INTERVAL = 16; // было 5ms → 16ms (60fps)

// 2. Кэширование путей для предотвращения лишних морфов
let pathCache = new Map();

function optimizedMorphPath(el, newD, duration=MORPH_DURATION) {
  const elementId = el.id || el.className;
  const cachedPath = pathCache.get(elementId);
  
  if (cachedPath === newD) return; // Skip if path unchanged
  
  pathCache.set(elementId, newD);
  
  const old = el.getAttribute('d') || newD;
  if (old === newD) return;
  
  let interp;
  try { 
    interp = flubber.interpolate(old, newD, {maxSegmentLength: 2}); 
  } catch(e) { 
    el.setAttribute('d', newD); 
    return; 
  }
  
  const start = performance.now();
  function frame(t) {
    const p = Math.min(1, (t - start) / duration);
    el.setAttribute('d', interp(p));
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// 3. Оптимизация проверки столкновений - простая версия
function optimizedPhysicsStep() {
  // Сначала обновляем позиции
  for (const b of blobs) {
    if (!b.isHovered && !b.isFrozen && b.visible) {
      b.vx *= 0.94; 
      b.vy *= 0.94;
      b.vx += Math.sin((performance.now()/1000) + b.id * 0.9) * IDLE_AMPLITUDE;
      b.vy += Math.cos((performance.now()/1000) + b.id * 1.1) * IDLE_AMPLITUDE;
      b.x += b.vx; 
      b.y += b.vy;
    }
    
    // Границы
    const gap = 8;
    if (b.x - b.r < gap) { b.x = gap + b.r; b.vx *= -0.42; }
    if (b.x + b.r > W - gap) { b.x = W - gap - b.r; b.vx *= -0.42; }
    if (b.y - b.r < gap) { b.y = gap + b.r; b.vy *= -0.42; }
    if (b.y + b.r > H - gap) { b.y = H - gap - b.r; b.vy *= -0.42; }
  }
  
  // Оптимизированные столкновения: только для видимых блопов
  const visibleBlobs = blobs.filter(b => b.visible);
  for (let i = 0; i < visibleBlobs.length; i++) {
    for (let j = i + 1; j < visibleBlobs.length; j++) {
      const A = visibleBlobs[i], B = visibleBlobs[j];
      const dx = B.x - A.x, dy = B.y - A.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const min = A.r + B.r + CENTER_GAP;
      
      if (d < min) {
        const overlap = (min - d) * 0.6;
        const nx = dx / d, ny = dy / d;
        A.x -= nx * overlap * 0.5; A.y -= ny * overlap * 0.5;
        B.x += nx * overlap * 0.5; B.y += ny * overlap * 0.5;
        const imp = 0.18;
        A.vx -= nx * imp; A.vy -= ny * imp;
        B.vx += nx * imp; B.vy += ny * imp;
      }
    }
  }
  
  for (const b of blobs) { 
    b.targetX = b.x; 
    b.targetY = b.y; 
  }
}

// 4. Throttled recompute with change detection
let lastPositions = new Map();
let shouldRecompute = false;

function checkPositionChanges() {
  shouldRecompute = false;
  for (const b of blobs) {
    if (!b.visible) continue;
    const key = b.id;
    const lastPos = lastPositions.get(key);
    const currentPos = [b.dispX, b.dispY];
    
    if (!lastPos || 
        Math.abs(lastPos[0] - currentPos[0]) > 0.5 || 
        Math.abs(lastPos[1] - currentPos[1]) > 0.5) {
      shouldRecompute = true;
      lastPositions.set(key, currentPos);
    }
  }
  return shouldRecompute;
}

function optimizedRecomputeAndRender(forceImmediate = false) {
  const now = performance.now();
  if (!forceImmediate && now - lastCompute < RECOMPUTE_INTERVAL) return;
  if (!forceImmediate && !checkPositionChanges()) return; // Skip if no movement
  
  lastCompute = now;
  // ... rest of recomputeAndRender logic remains the same
}

// 5. Debounced event handlers
function createDebouncedHandler(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 6. Оптимизация CSS с will-change
function optimizeElementPerformance(element) {
  element.style.willChange = 'transform, opacity';
  element.style.backfaceVisibility = 'hidden';
  element.style.transform = 'translateZ(0)'; // Force GPU layer
}
