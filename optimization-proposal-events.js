// ОПТИМИЗАЦИЯ touch-adapter.js и event handling

class OptimizedTouchAdapter {
  constructor() {
    this.activePointers = new Map();
    this.eventQueue = [];
    this.isProcessing = false;
    
    // Throttle для mouse/pointer events
    this.lastMoveTime = 0;
    this.moveThrottle = 16; // ~60fps
    
    // Pool для event objects
    this.eventPool = [];
  }
  
  // Переиспользование event objects
  createPointerEvent(type, x, y, pointerId = 0) {
    let ev;
    if (this.eventPool.length > 0) {
      ev = this.eventPool.pop();
      ev.type = type;
      ev.clientX = x;
      ev.clientY = y;
      ev.pointerId = pointerId;
    } else {
      try {
        if (typeof PointerEvent !== 'undefined') {
          ev = new PointerEvent(type, { 
            clientX: x, 
            clientY: y, 
            pointerId: pointerId,
            bubbles: true, 
            cancelable: true 
          });
        } else {
          ev = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperty(ev, 'clientX', { value: x, enumerable: true });
          Object.defineProperty(ev, 'clientY', { value: y, enumerable: true });
          Object.defineProperty(ev, 'pointerId', { value: pointerId, enumerable: true });
        }
      } catch(_) {
        ev = { type, clientX: x, clientY: y, pointerId };
      }
    }
    return ev;
  }
  
  releaseEvent(ev) {
    if (this.eventPool.length < 20) { // Limit pool size
      this.eventPool.push(ev);
    }
  }
  
  // Throttled event processing
  queueEvent(eventData) {
    this.eventQueue.push(eventData);
    if (!this.isProcessing) {
      this.isProcessing = true;
      requestAnimationFrame(() => this.processEventQueue());
    }
  }
  
  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const eventData = this.eventQueue.shift();
      this.dispatchOptimizedEvent(eventData);
    }
    this.isProcessing = false;
  }
  
  dispatchOptimizedEvent({ type, x, y, target, pointerId }) {
    const now = performance.now();
    
    // Throttle move events
    if (type === 'pointermove' && now - this.lastMoveTime < this.moveThrottle) {
      return;
    }
    if (type === 'pointermove') {
      this.lastMoveTime = now;
    }
    
    const ev = this.createPointerEvent(type, x, y, pointerId);
    target.dispatchEvent(ev);
    this.releaseEvent(ev);
  }
  
  setupOptimizedListeners(element) {
    if (!element) return;
    
    // Use passive listeners where possible
    const passiveOptions = { passive: true };
    const activeOptions = { passive: false };
    
    element.addEventListener('touchstart', (e) => {
      for (const touch of e.changedTouches) {
        if (this.activePointers.size >= 2) return; // Limit concurrent touches
        
        this.activePointers.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
          startTime: performance.now()
        });
        
        this.queueEvent({
          type: 'pointerdown',
          x: touch.clientX,
          y: touch.clientY,
          target: element,
          pointerId: touch.identifier
        });
      }
    }, passiveOptions);
    
    element.addEventListener('touchmove', (e) => {
      for (const touch of e.changedTouches) {
        const pointer = this.activePointers.get(touch.identifier);
        if (!pointer) continue;
        
        // Only prevent default for significant movement
        const deltaX = Math.abs(touch.clientX - pointer.x);
        const deltaY = Math.abs(touch.clientY - pointer.y);
        
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault();
        }
        
        this.queueEvent({
          type: 'pointermove',
          x: touch.clientX,
          y: touch.clientY,
          target: element,
          pointerId: touch.identifier
        });
      }
    }, activeOptions);
    
    element.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        this.activePointers.delete(touch.identifier);
        
        this.queueEvent({
          type: 'pointerup',
          x: touch.clientX,
          y: touch.clientY,
          target: element,
          pointerId: touch.identifier
        });
      }
    }, passiveOptions);
    
    element.addEventListener('touchcancel', (e) => {
      for (const touch of e.changedTouches) {
        this.activePointers.delete(touch.identifier);
        
        this.queueEvent({
          type: 'pointerup',
          x: touch.clientX,
          y: touch.clientY,
          target: element,
          pointerId: touch.identifier
        });
      }
    }, passiveOptions);
  }
}

// Оптимизированный event delegation для overlay
class OptimizedOverlayEvents {
  constructor() {
    this.handlers = new Map();
    this.throttledHandlers = new Map();
  }
  
  // Создать throttled версию обработчика
  createThrottledHandler(handler, delay = 16) {
    let timeoutId;
    let lastArgs;
    
    return (...args) => {
      lastArgs = args;
      
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          handler.apply(this, lastArgs);
          timeoutId = null;
        }, delay);
      }
    };
  }
  
  // Добавить optimized wheel handler
  addWheelHandler(element, handler) {
    const optimizedHandler = this.createThrottledHandler((e) => {
      e.preventDefault();
      handler(e);
    }, 50); // Throttle wheel events
    
    element.addEventListener('wheel', optimizedHandler, { 
      passive: false,
      capture: true
    });
    
    return () => {
      element.removeEventListener('wheel', optimizedHandler, { 
        passive: false,
        capture: true
      });
    };
  }
  
  // Batch touch event processing
  addTouchHandlers(element, handlers) {
    const { onStart, onMove, onEnd } = handlers;
    let touchData = null;
    let isTracking = false;
    
    const batchedMove = this.createThrottledHandler((e) => {
      if (onMove && isTracking) {
        onMove(e, touchData);
      }
    }, 16);
    
    element.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchData = {
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: performance.now()
        };
        isTracking = true;
        if (onStart) onStart(e, touchData);
      }
    }, { passive: true });
    
    element.addEventListener('touchmove', batchedMove, { passive: false });
    
    element.addEventListener('touchend', (e) => {
      if (onEnd && isTracking) {
        onEnd(e, touchData);
      }
      isTracking = false;
      touchData = null;
    }, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', onStart);
      element.removeEventListener('touchmove', batchedMove);
      element.removeEventListener('touchend', onEnd);
    };
  }
}

// Intersection Observer для видимости блопов
class VisibilityOptimizer {
  constructor(blobs, container) {
    this.blobs = blobs;
    this.visibleBlobs = new Set();
    
    // Расширенная область видимости для плавного появления
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const blobId = entry.target.dataset.blobId;
        const blob = this.blobs.find(b => b.id.toString() === blobId);
        
        if (blob) {
          if (entry.isIntersecting) {
            this.visibleBlobs.add(blob);
            blob.isInViewport = true;
          } else {
            this.visibleBlobs.delete(blob);
            blob.isInViewport = false;
          }
        }
      }
    }, {
      root: container,
      rootMargin: '50px', // Preload slightly outside viewport
      threshold: 0.1
    });
    
    // Observe all blob elements
    this.blobs.forEach(blob => {
      if (blob.group) {
        blob.group.dataset.blobId = blob.id;
        this.observer.observe(blob.group);
      }
    });
  }
  
  getVisibleBlobs() {
    return Array.from(this.visibleBlobs);
  }
  
  cleanup() {
    this.observer.disconnect();
  }
}

// Использование:
// const touchAdapter = new OptimizedTouchAdapter();
// const overlayEvents = new OptimizedOverlayEvents();
// const visibilityOptimizer = new VisibilityOptimizer(blobs, container);
