// СИСТЕМА МОНИТОРИНГА И АДАПТИВНОЙ ОПТИМИЗАЦИИ

class PerformanceMonitor {
  constructor() {
    this.frameRate = 60;
    this.frameTimes = [];
    this.performanceLevel = 'high'; // high, medium, low
    this.metrics = {
      avgFrameTime: 0,
      fps: 60,
      memoryUsage: 0,
      blobCount: 0,
      renderTime: 0
    };
    
    this.thresholds = {
      excellent: 60,
      good: 45,
      poor: 30,
      critical: 15
    };
    
    this.adaptiveSettings = {
      high: {
        recomputeInterval: 16, // 60fps
        maxBlobs: 12,
        morphingEnabled: true,
        filtersEnabled: true,
        shadowsEnabled: true
      },
      medium: {
        recomputeInterval: 33, // 30fps
        maxBlobs: 8,
        morphingEnabled: true,
        filtersEnabled: false,
        shadowsEnabled: false
      },
      low: {
        recomputeInterval: 50, // 20fps
        maxBlobs: 5,
        morphingEnabled: false,
        filtersEnabled: false,
        shadowsEnabled: false
      }
    };
    
    this.init();
  }
  
  init() {
    // Мониторинг FPS
    this.startFPSMonitoring();
    
    // Мониторинг памяти (если доступен)
    if (performance.memory) {
      setInterval(() => this.checkMemoryUsage(), 5000);
    }
    
    // Детектор медленных фреймов
    this.setupSlowFrameDetection();
    
    // Адаптивная система
    this.startAdaptiveOptimization();
  }
  
  startFPSMonitoring() {
    let lastTime = performance.now();
    
    const measureFrame = (currentTime) => {
      const frameTime = currentTime - lastTime;
      lastTime = currentTime;
      
      this.frameTimes.push(frameTime);
      
      // Держим только последние 60 фреймов
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
      }
      
      // Обновляем метрики каждые 30 фреймов
      if (this.frameTimes.length % 30 === 0) {
        this.updateMetrics();
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }
  
  updateMetrics() {
    if (this.frameTimes.length === 0) return;
    
    // Средний FPS
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.metrics.avgFrameTime = avgFrameTime;
    this.metrics.fps = Math.round(1000 / avgFrameTime);
    
    // Определяем уровень производительности
    this.determinePerformanceLevel();
    
    // Применяем адаптивные настройки
    this.applyAdaptiveSettings();
  }
  
  determinePerformanceLevel() {
    const fps = this.metrics.fps;
    
    if (fps >= this.thresholds.excellent) {
      this.performanceLevel = 'high';
    } else if (fps >= this.thresholds.good) {
      this.performanceLevel = 'medium';
    } else if (fps >= this.thresholds.poor) {
      this.performanceLevel = 'low';
    } else {
      this.performanceLevel = 'critical';
    }
  }
  
  applyAdaptiveSettings() {
    const settings = this.adaptiveSettings[this.performanceLevel] || this.adaptiveSettings.low;
    
    // Обновляем интервал рекомпьютинга
    if (window.recomputeInterval !== settings.recomputeInterval) {
      window.recomputeInterval = settings.recomputeInterval;
      console.log(`🎛️ Performance mode: ${this.performanceLevel}, interval: ${settings.recomputeInterval}ms`);
    }
    
    // Управляем максимальным количеством блопов
    if (window.blobs && window.blobs.length > settings.maxBlobs) {
      window.blobs = window.blobs.slice(0, settings.maxBlobs);
    }
    
    // Включаем/выключаем морфинг
    window.morphingEnabled = settings.morphingEnabled;
    
    // Управляем CSS фильтрами
    this.toggleCSSFeatures(settings);
  }
  
  toggleCSSFeatures(settings) {
    const blobs = document.querySelectorAll('.blob');
    
    blobs.forEach(blob => {
      if (!settings.filtersEnabled) {
        blob.style.filter = 'none';
      }
      
      if (!settings.shadowsEnabled) {
        blob.style.boxShadow = 'none';
      }
      
      // Добавляем класс для низкой производительности
      if (this.performanceLevel === 'low' || this.performanceLevel === 'critical') {
        blob.classList.add('low-performance-mode');
      } else {
        blob.classList.remove('low-performance-mode');
      }
    });
  }
  
  setupSlowFrameDetection() {
    let lastFrameTime = performance.now();
    
    const detectSlowFrame = (currentTime) => {
      const frameTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      
      // Если фрейм занял больше 33ms (меньше 30 FPS)
      if (frameTime > 33) {
        this.handleSlowFrame(frameTime);
      }
      
      requestAnimationFrame(detectSlowFrame);
    };
    
    requestAnimationFrame(detectSlowFrame);
  }
  
  handleSlowFrame(frameTime) {
    console.warn(`🐌 Slow frame detected: ${frameTime.toFixed(2)}ms`);
    
    // Временное снижение качества
    if (frameTime > 100) { // Очень медленный фрейм
      this.emergencyOptimization();
    }
  }
  
  emergencyOptimization() {
    console.log('🚨 Emergency optimization activated');
    
    // Временно отключаем все анимации
    document.body.classList.add('scrolling');
    
    // Возвращаем через 1 секунду
    setTimeout(() => {
      document.body.classList.remove('scrolling');
    }, 1000);
  }
  
  checkMemoryUsage() {
    if (performance.memory) {
      const memory = performance.memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      // Если использование памяти больше 80%
      if (this.metrics.memoryUsage > 0.8) {
        console.warn('🧠 High memory usage detected:', Math.round(this.metrics.memoryUsage * 100) + '%');
        this.forceGarbageCollection();
      }
    }
  }
  
  forceGarbageCollection() {
    // Очищаем кэши
    if (window.pathCache) {
      const cacheSize = Object.keys(window.pathCache).length;
      if (cacheSize > 100) {
        window.pathCache = {};
        console.log('🗑️ Path cache cleared');
      }
    }
    
    // Очищаем старые референсы на блопы
    if (window.blobs) {
      window.blobs = window.blobs.filter(blob => document.body.contains(blob.element));
    }
  }
  
  startAdaptiveOptimization() {
    // Адаптация каждые 2 секунды
    setInterval(() => {
      this.adaptToDeviceCapabilities();
    }, 2000);
  }
  
  adaptToDeviceCapabilities() {
    // Детекция мобильных устройств
    if (window.innerWidth <= 768) {
      this.optimizeForMobile();
    }
    
    // Детекция устройств с низким энергопотреблением
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) { // Низкий заряд батареи
          this.activatePowerSaveMode();
        }
      });
    }
    
    // Детекция медленного соединения
    if (navigator.connection && navigator.connection.effectiveType) {
      const connection = navigator.connection.effectiveType;
      if (connection === 'slow-2g' || connection === '2g') {
        this.activateSlowConnectionMode();
      }
    }
  }
  
  optimizeForMobile() {
    // Уменьшаем количество блопов на мобильных
    if (window.blobs && window.blobs.length > 6) {
      window.blobs = window.blobs.slice(0, 6);
    }
    
    // Отключаем сложные анимации на мобильных
    document.body.classList.add('mobile-optimized');
  }
  
  activatePowerSaveMode() {
    console.log('🔋 Power save mode activated');
    this.performanceLevel = 'low';
    this.applyAdaptiveSettings();
  }
  
  activateSlowConnectionMode() {
    console.log('🐌 Slow connection detected');
    // Останавливаем все несущественные анимации
    window.recomputeInterval = 100; // 10 FPS
  }
  
  getPerformanceReport() {
    return {
      ...this.metrics,
      performanceLevel: this.performanceLevel,
      deviceInfo: {
        userAgent: navigator.userAgent,
        memory: navigator.deviceMemory || 'unknown',
        cores: navigator.hardwareConcurrency || 'unknown',
        connection: navigator.connection?.effectiveType || 'unknown'
      }
    };
  }
  
  // Публичный API для интеграции с основным кодом
  shouldSkipFrame() {
    return this.metrics.fps < this.thresholds.critical;
  }
  
  shouldUseLowQuality() {
    return this.performanceLevel === 'low' || this.performanceLevel === 'critical';
  }
  
  getOptimalFrameInterval() {
    return this.adaptiveSettings[this.performanceLevel]?.recomputeInterval || 50;
  }
}

// Интеграция с основным кодом
window.performanceMonitor = new PerformanceMonitor();

// Модификация основного цикла рендеринга для использования адаптивной оптимизации
const originalRecomputeAndRender = window.recomputeAndRender;
if (originalRecomputeAndRender) {
  window.recomputeAndRender = function() {
    // Пропускаем фрейм если производительность критически низкая
    if (window.performanceMonitor.shouldSkipFrame()) {
      return;
    }
    
    const startTime = performance.now();
    
    // Вызываем оригинальную функцию
    originalRecomputeAndRender.call(this);
    
    const renderTime = performance.now() - startTime;
    window.performanceMonitor.metrics.renderTime = renderTime;
    
    // Если рендеринг занял слишком много времени, увеличиваем интервал
    if (renderTime > 20) {
      window.recomputeInterval = Math.min(window.recomputeInterval + 5, 100);
    }
  };
}

// Экспорт для использования в консоли разработчика
window.getPerformanceReport = () => window.performanceMonitor.getPerformanceReport();

console.log('🎯 Performance monitoring system activated');
console.log('📊 Use getPerformanceReport() to see current metrics');
