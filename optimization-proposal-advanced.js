// ГЛУБОКАЯ ОПТИМИЗАЦИЯ физики блопов

class OptimizedBlobPhysics {
  constructor(blobs, containerWidth, containerHeight) {
    this.blobs = blobs;
    this.W = containerWidth;
    this.H = containerHeight;
    
    // Spatial hashing для эффективного поиска соседей
    this.gridSize = 100; // размер ячейки сетки
    this.cols = Math.ceil(this.W / this.gridSize);
    this.rows = Math.ceil(this.H / this.gridSize);
    this.spatialGrid = new Array(this.cols * this.rows);
    
    // Object pools для переиспользования объектов
    this.vectorPool = [];
    this.collisionPool = [];
    
    // Батчинг обновлений DOM
    this.domUpdateQueue = [];
    this.isUpdatingDOM = false;
  }
  
  // Spatial hashing для O(n) вместо O(n²) столкновений
  updateSpatialGrid() {
    // Очищаем сетку
    for (let i = 0; i < this.spatialGrid.length; i++) {
      this.spatialGrid[i] = [];
    }
    
    // Размещаем блопы в ячейках
    for (const blob of this.blobs) {
      if (!blob.visible) continue;
      
      const cellX = Math.floor(blob.x / this.gridSize);
      const cellY = Math.floor(blob.y / this.gridSize);
      const cellIndex = cellY * this.cols + cellX;
      
      if (cellIndex >= 0 && cellIndex < this.spatialGrid.length) {
        this.spatialGrid[cellIndex].push(blob);
      }
    }
  }
  
  // Получить соседние ячейки для проверки столкновений
  getNearbyBlobs(blob) {
    const nearby = [];
    const cellX = Math.floor(blob.x / this.gridSize);
    const cellY = Math.floor(blob.y / this.gridSize);
    
    // Проверяем 9 ячеек (3x3) вокруг текущей
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = cellX + dx;
        const checkY = cellY + dy;
        
        if (checkX >= 0 && checkX < this.cols && 
            checkY >= 0 && checkY < this.rows) {
          const cellIndex = checkY * this.cols + checkX;
          nearby.push(...this.spatialGrid[cellIndex]);
        }
      }
    }
    
    return nearby;
  }
  
  // Оптимизированная физика с spatial hashing
  physicsStep() {
    this.updateSpatialGrid();
    
    // Обновление позиций
    for (const b of this.blobs) {
      if (!b.isHovered && !b.isFrozen && b.visible) {
        // Simplified physics calculations
        b.vx *= 0.94; 
        b.vy *= 0.94;
        
        // Используем предвычисленные значения для idle movement
        const time = performance.now() / 1000;
        b.vx += Math.sin(time + b.idlePhase1) * IDLE_AMPLITUDE;
        b.vy += Math.cos(time + b.idlePhase2) * IDLE_AMPLITUDE;
        
        b.x += b.vx; 
        b.y += b.vy;
      }
      
      // Boundary checks
      this.checkBoundaries(b);
    }
    
    // Collision detection using spatial hashing
    const processedPairs = new Set();
    
    for (const blob of this.blobs) {
      if (!blob.visible) continue;
      
      const nearby = this.getNearbyBlobs(blob);
      
      for (const other of nearby) {
        if (blob === other || !other.visible) continue;
        
        // Avoid duplicate checks
        const pairKey = blob.id < other.id ? 
          `${blob.id}-${other.id}` : `${other.id}-${blob.id}`;
        
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);
        
        this.resolveCollision(blob, other);
      }
    }
    
    // Update targets
    for (const b of this.blobs) { 
      b.targetX = b.x; 
      b.targetY = b.y; 
    }
  }
  
  checkBoundaries(b) {
    const gap = 8;
    const bounceCoeff = -0.42;
    
    if (b.x - b.r < gap) { 
      b.x = gap + b.r; 
      b.vx *= bounceCoeff; 
    }
    if (b.x + b.r > this.W - gap) { 
      b.x = this.W - gap - b.r; 
      b.vx *= bounceCoeff; 
    }
    if (b.y - b.r < gap) { 
      b.y = gap + b.r; 
      b.vy *= bounceCoeff; 
    }
    if (b.y + b.r > this.H - gap) { 
      b.y = this.H - gap - b.r; 
      b.vy *= bounceCoeff; 
    }
  }
  
  resolveCollision(A, B) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const min = A.r + B.r + CENTER_GAP;
    
    if (d < min) {
      const overlap = (min - d) * 0.6;
      const nx = dx / d;
      const ny = dy / d;
      
      A.x -= nx * overlap * 0.5; 
      A.y -= ny * overlap * 0.5;
      B.x += nx * overlap * 0.5; 
      B.y += ny * overlap * 0.5;
      
      const imp = 0.18;
      A.vx -= nx * imp; 
      A.vy -= ny * imp;
      B.vx += nx * imp; 
      B.vy += ny * imp;
    }
  }
}

// Оптимизированный рендеринг с батчингом
class OptimizedRenderer {
  constructor() {
    this.pendingUpdates = new Map();
    this.isRendering = false;
    this.pathCache = new Map();
    this.lastPaths = new Map();
  }
  
  // Добавить обновление в очередь
  queueUpdate(elementId, property, value) {
    if (!this.pendingUpdates.has(elementId)) {
      this.pendingUpdates.set(elementId, {});
    }
    this.pendingUpdates.get(elementId)[property] = value;
    
    if (!this.isRendering) {
      this.isRendering = true;
      requestAnimationFrame(() => this.flushUpdates());
    }
  }
  
  // Применить все накопленные обновления
  flushUpdates() {
    for (const [elementId, updates] of this.pendingUpdates) {
      const element = document.getElementById(elementId);
      if (!element) continue;
      
      for (const [property, value] of Object.entries(updates)) {
        if (property === 'd') {
          this.updatePath(element, value);
        } else {
          element.setAttribute(property, value);
        }
      }
    }
    
    this.pendingUpdates.clear();
    this.isRendering = false;
  }
  
  updatePath(element, newPath) {
    const elementKey = element.id || element.className;
    const lastPath = this.lastPaths.get(elementKey);
    
    if (lastPath === newPath) return; // Skip if unchanged
    
    this.lastPaths.set(elementKey, newPath);
    
    // Use optimized morphing or direct update
    if (this.shouldUseMorph(element)) {
      this.morphPath(element, newPath);
    } else {
      element.setAttribute('d', newPath);
    }
  }
  
  shouldUseMorph(element) {
    // Use morph only for important transitions
    return element.classList.contains('important-morph') || 
           performance.now() % 3 === 0; // Reduce morph frequency
  }
  
  morphPath(element, newPath) {
    // Simplified morphing with reduced complexity
    const oldPath = element.getAttribute('d') || newPath;
    if (oldPath === newPath) return;
    
    try {
      const interp = flubber.interpolate(oldPath, newPath, {
        maxSegmentLength: 4, // Reduced precision for better performance
        string: false
      });
      
      const duration = 200; // Shorter duration
      const start = performance.now();
      
      const animate = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        element.setAttribute('d', interp(progress));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } catch (e) {
      element.setAttribute('d', newPath);
    }
  }
}

// Memory pool для переиспользования объектов
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  get() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFn();
  }
  
  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Использование:
// const physics = new OptimizedBlobPhysics(blobs, W, H);
// const renderer = new OptimizedRenderer();

// В main loop:
// physics.physicsStep();
// renderer.queueUpdate(blob.clipPathEl.id, 'd', newPath);
