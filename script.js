(() => {
  const svg = document.getElementById('svgRoot');
  const container = document.getElementById('container');
  let W = container.clientWidth, H = container.clientHeight;
  // Helper: detect small-screen phones
  function isMobile(){
    return window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
  }
  window.addEventListener('resize', () => {
    W = container.clientWidth; H = container.clientHeight; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for(const kv of Object.values(categoryVideos)){
      if(kv.fo){ kv.fo.setAttribute('width', W); kv.fo.setAttribute('height', H); const vid = kv.fo.querySelector('video'); if(vid){ vid.style.width = W + 'px'; vid.style.height = H + 'px'; } }
    }
    for(const b of blobs){ if(b.fo){ b.fo.setAttribute('width', W); b.fo.setAttribute('height', H); const el = b.fo.querySelector('video,img'); if(el){ el.style.width = W + 'px'; el.style.height = H + 'px'; } } }
    recomputeAndRender(true);
  });
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // --- data ---
  const ORIGINAL = [];
  const categories = [
    { id: 'alpha', title: 'Project Alpha', src: 'https://videos.pexels.com/video-files/4508065/4508065-uhd_2560_1440_25fps.mp4' },
    { id: 'beta',  title: 'Project Beta',  src: 'https://videos.pexels.com/video-files/16029681/16029681-uhd_2560_1440_30fps.mp4' },
    { id: 'gamma', title: 'Project Gamma', src: 'https://videos.pexels.com/video-files/8333185/8333185-hd_1080_1080_30fps.mp4' }
  ];

  // Fallback image generator (guaranteed to work)
  function picsum(seed, w=1200, h=800){ return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`; }

  // Build ORIGINAL with overlay data from OVERLAY_CONTENT in content.js
  categories.forEach(cat => {
    for (let i = 1; i <= 5; i++) {
      const projectId = `${cat.id}${i}`;
      const overlayData = window.OVERLAY_CONTENT?.[projectId];
      
      if (overlayData) {
        // Use data from content.js
        const text = `<h2>${overlayData.title}</h2>
          <p>${overlayData.paragraphs[0]}</p>
          <p>Technologies and approach: ${cat.id.toUpperCase()}.</p>`;

        ORIGINAL.push({
          id: projectId,
          src: cat.src,
          title: overlayData.title,
          imgs: overlayData.images,
          text: text,
          caption: overlayData.figure.caption,
          category: cat.id,
          overlay: overlayData
        });
      } else {
        // Fallback if content.js data not available
        const images = [picsum(`${cat.id}-${i}-1`), picsum(`${cat.id}-${i}-2`), picsum(`${cat.id}-${i}-3`)];
        const title = `${cat.title} ${i}`;
        const overlayFallback = window.getOverlayData?.(projectId, cat.id, title, images) || {
          title: title,
          images: images,
          paragraphs: [`${title}: uniquely curated content block describing goals, context, and outcomes.`],
          list: [
            { img: images[0], text: 'Research and analysis phase.' },
            { img: images[1], text: 'Implementation and testing.' },
            { img: images[2], text: 'Results and optimization.' }
          ],
          blocks: [{ img: images[1], text: 'Technical implementation details.' }],
          figure: { img: images[2], caption: `${title} implementation results.` }
        };

        const text = `<h2>${title}</h2>
          <p>${title}: uniquely curated content block describing goals, context, and outcomes. Iteration ${i} focuses on different angles.</p>
          <p>Technologies: D3, SVG, CSS. Category: ${cat.id.toUpperCase()}.</p>`;

        ORIGINAL.push({
          id: projectId,
          src: cat.src,
          title: overlayFallback.title,
          imgs: overlayFallback.images,
          text: text,
          caption: overlayFallback.figure.caption,
          category: cat.id,
          overlay: overlayFallback
        });
      }
    }
  });

  // Clone set ("II") with their own overlay data
  const VIDEOS = [
    ...ORIGINAL,
    ...ORIGINAL.map(v => {
      const cloneId = v.id + '2';
      const cloneTitle = v.title + ' II';
      const cloneImages = v.imgs.map((u, k) => picsum(`${v.id}-ii-${k+1}`));
      
      // Create clone overlay data
      const cloneOverlay = {
        ...v.overlay,
        title: cloneTitle,
        images: cloneImages,
        paragraphs: v.overlay.paragraphs.map(p => p.replace(v.overlay.title, cloneTitle)),
        figure: { ...v.overlay.figure, caption: v.overlay.figure.caption.replace(v.overlay.title, cloneTitle) }
      };
      
      return { 
        ...v, 
        id: cloneId, 
        title: cloneTitle, 
        imgs: cloneImages,
        overlay: cloneOverlay
      };
    })
  ];

  // --- params ---
  // VIDEO_SOURCES: массив URL видео, используется для заполнения локальных video элементов.
  const VIDEO_SOURCES = VIDEOS.map(v=>v.src); // менять только если нужно заменить источники видео

  // BLOB_COUNT: количество блопов (чем больше — тем выше нагрузка на вычисления Voronoi и рендер).
  // Уменьшайте для тестирования на слабых машинах.
  const BLOB_COUNT = 15;

  // MIN_R / MAX_R: диапазон радиусов блопа при создании (в пикселях, зависят от размеров контейнера).
  // Значение влияет на плотность рассадки и на итоговые размеры ячеек в диаграмме.
  const MIN_R = Math.min(W, H) * 0.05; // минимальный радиус блопа
  const MAX_R = Math.min(W, H) * 0.12; // максимальный радиус блопа

  // INSET_GAP: внутренний отступ (в пикселях) при усечении контуров — контролирует зазор между соседними блопами.
  const INSET_GAP = 8;

  // CHAIKIN_ITERS: количество итераций сглаживания (Чайкин). Больше итераций -> более плавный, но более дорогой по CPU контур.
  const CHAIKIN_ITERS = 5; // уменьшаем с 10 до 5 как в рабочем примере

  // RESAMPLE_POINTS / RESAMPLE_FINAL: размеры выборки точек для промежуточной ресемплизации.
  // RESAMPLE_POINTS влияет на качество промежуточного сглаживания, RESAMPLE_FINAL — на детализацию итогового path.
  // Уменьшаем значения для соответствия рабочему примеру и улучшения морфинга
  const RESAMPLE_POINTS = 64; // уменьшаем с 192 до 64 как в рабочем примере
  const RESAMPLE_FINAL = 128;  // уменьшаем с 320 до 128 для стабильности

  // VIDEO_PADDING: дополнительный отступ вокруг вычисленной области для видео внутри блопа.
  // Влияет на масштаб и кроп видео внутри клетки.
  const VIDEO_PADDING = 14;

  // DEFAULT_IDLE_AMPLITUDE: базовая амплитуда «шевеления» блопов в режиме overview.
  // IDLE_AMPLITUDE — текущее значение, которое скрипт может менять во время фильтрации.
  // Увеличение -> более заметное плавание; уменьшение -> более статичная сцена.
  const DEFAULT_IDLE_AMPLITUDE = 0.02;
  let IDLE_AMPLITUDE = DEFAULT_IDLE_AMPLITUDE;

  // CENTER_GAP: минимальный суммарный отступ/защитная дистанция при разрешении пересечений центров.
  // Увеличение этого значения приведёт к более явному отталкиванию блопов друг от друга.
  const CENTER_GAP = 100;

  // RECOMPUTE_INTERVAL: минимальный интервал (ms) между пересчётами Voronoi/рендером — влияет на производительность.
  // Увеличьте, если хотите снизить нагрузку CPU, но учтите ухудшение плавности анимаций.
  let RECOMPUTE_INTERVAL = 5; // уменьшить с 10 до 5 для более частого обновления
  window.RECOMPUTE_INTERVAL = RECOMPUTE_INTERVAL; // Глобальная ссылка для мониторинга

  // DISPLAY_LERP: коэффициент сглаживания движения отображаемых позиций (dispX/dispY).
  // Меньше значение -> более плавное, но более медленное следование цели; больше -> более резкое движение.
  let DISPLAY_LERP = 0.1;     // smoothing of displayed centers

  // MORPH_DURATION: стандартная длительность морфинга path'ов (ms). При фильтрации временно увеличивается.
  // Уменьшаем до значений из рабочего примера для более быстрого морфинга
  let MORPH_DURATION = 300;    // уменьшаем с 900 до 300 как в рабочем примере
  
  // SMOOTH MORPHING: настройки для плавного морфинга во время движения
  const MOVEMENT_MORPH_DURATION = 150;  // Быстрый морфинг для движения
  const DRAG_MORPH_DURATION = 100;      // Еще быстрее для перетаскивания
  const VIDEO_MORPH_DURATION = 200;     // Синхронизация видео с контурами

  // pending timeouts used to prevent racing transitions
  let _pendingTimeouts = [];
  function clearPending(){ for(const t of _pendingTimeouts) clearTimeout(t); _pendingTimeouts = []; }

  function randDensity(){ return 0.5 + Math.random()*1.6; }

  // --- blob model ---
  window.blobs = [];
  const blobs = window.blobs; // Локальная ссылка для удобства
  for(let i=0;i<BLOB_COUNT;i++){
    const x = Math.random()*(W*0.8)+W*0.1;
    const y = Math.random()*(H*0.5)+H*0.1;
    const data = ORIGINAL[i]; const cat = data ? data.category : categories[i % categories.length].id; const imgSrc = (data && data.imgs && data.imgs[0]) || ''; 
    blobs.push({
      id:i, x, y, vx:(Math.random()-0.5)*0.9, vy:(Math.random()-0.5)*0.9,
      r: Math.random()*(MAX_R-MIN_R)+MIN_R,
      density: randDensity(), videoIndex:i%VIDEO_SOURCES.length,
      category: cat, imageSrc: imgSrc, data: data || null,
      clipPathEl:null, pathEl:null, fo:null, group:null, outline:null, label:null,
      lastPath: null,
      dispX: x, dispY: y, targetX: x, targetY: y,
      isHovered:false, isFrozen:false, hoverExpanded:0,
      frozenFO: null, frozenLabel: null, frozenVideoTransform: undefined,
      frozenPath: null,
      visible:true, gridMode:false
    });
  }

  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs'); svg.appendChild(defs);

  // NEW: strong multi-color glow filter (purple/pink/cyan)
  if (!document.getElementById('blob-glow')) {
    const glow = document.createElementNS('http://www.w3.org/2000/svg','filter');
    glow.setAttribute('id','blob-glow');
    glow.setAttribute('color-interpolation-filters','sRGB');

    const baseBlur = document.createElementNS('http://www.w3.org/2000/svg','feGaussianBlur');
    baseBlur.setAttribute('in','SourceGraphic'); baseBlur.setAttribute('stdDeviation','1.2'); baseBlur.setAttribute('result','base');
    glow.appendChild(baseBlur);

    // Purple layer
    let flood = document.createElementNS('http://www.w3.org/2000/svg','feFlood');
    flood.setAttribute('flood-color','#7a5cff'); flood.setAttribute('flood-opacity','0.85'); flood.setAttribute('result','c1'); glow.appendChild(flood);
    let comp = document.createElementNS('http://www.w3.org/2000/svg','feComposite');
    comp.setAttribute('in','c1'); comp.setAttribute('in2','base'); comp.setAttribute('operator','in'); comp.setAttribute('result','g1'); glow.appendChild(comp);
    let blur = document.createElementNS('http://www.w3.org/2000/svg','feGaussianBlur');
    blur.setAttribute('in','g1'); blur.setAttribute('stdDeviation','5'); blur.setAttribute('result','g1b'); glow.appendChild(blur);

    // Pink layer
    flood = document.createElementNS('http://www.w3.org/2000/svg','feFlood');
    flood.setAttribute('flood-color','#ff65d4'); flood.setAttribute('flood-opacity','0.65'); flood.setAttribute('result','c2'); glow.appendChild(flood);
    comp = document.createElementNS('http://www.w3.org/2000/svg','feComposite');
    comp.setAttribute('in','c2'); comp.setAttribute('in2','base'); comp.setAttribute('operator','in'); comp.setAttribute('result','g2'); glow.appendChild(comp);
    blur = document.createElementNS('http://www.w3.org/2000/svg','feGaussianBlur');
    blur.setAttribute('in','g2'); blur.setAttribute('stdDeviation','8'); blur.setAttribute('result','g2b'); glow.appendChild(blur);

    // Cyan layer
    flood = document.createElementNS('http://www.w3.org/2000/svg','feFlood');
    flood.setAttribute('flood-color','#00d9ff'); flood.setAttribute('flood-opacity','0.6'); flood.setAttribute('result','c3'); glow.appendChild(flood);
    comp = document.createElementNS('http://www.w3.org/2000/svg','feComposite');
    comp.setAttribute('in','c3'); comp.setAttribute('in2','base'); comp.setAttribute('operator','in'); comp.setAttribute('result','g3'); glow.appendChild(comp);
    blur = document.createElementNS('http://www.w3.org/2000/svg','feGaussianBlur');
    blur.setAttribute('in','g3'); blur.setAttribute('stdDeviation','12'); blur.setAttribute('result','g3b'); glow.appendChild(blur);

    const merge = document.createElementNS('http://www.w3.org/2000/svg','feMerge');
    ['g1b','g2b','g3b','SourceGraphic'].forEach(id=>{
      const n = document.createElementNS('http://www.w3.org/2000/svg','feMergeNode'); n.setAttribute('in', id); merge.appendChild(n);
    });
    glow.appendChild(merge);
    defs.appendChild(glow);
  }

  // NEW: blur filter for background when blobs are inactive
  if (!document.getElementById('background-blur')) {
    const backgroundBlur = document.createElementNS('http://www.w3.org/2000/svg','filter');
    backgroundBlur.setAttribute('id','background-blur');
    backgroundBlur.setAttribute('x','-50%');
    backgroundBlur.setAttribute('y','-50%');
    backgroundBlur.setAttribute('width','200%');
    backgroundBlur.setAttribute('height','200%');
    
    const blur = document.createElementNS('http://www.w3.org/2000/svg','feGaussianBlur');
    blur.setAttribute('in','SourceGraphic');
    blur.setAttribute('stdDeviation','3.5'); // увеличиваем блюр для заднего фона
    blur.setAttribute('result','blurred');
    backgroundBlur.appendChild(blur);
    
    defs.appendChild(backgroundBlur);
  }

  // --- CATEGORY CLIPPATHS + FULL-BLOCK VIDEOS (overview mode) ---
  const categoryClips = {};
  const categoryVideos = {};
  for(const cat of categories){
    const clip = document.createElementNS('http://www.w3.org/2000/svg','clipPath'); clip.setAttribute('id', 'cat-clip-'+cat.id); clip.setAttribute('clipPathUnits','userSpaceOnUse'); defs.appendChild(clip);
    categoryClips[cat.id] = clip;

    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    const fo = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
    fo.setAttribute('x', 0); fo.setAttribute('y', 0); fo.setAttribute('width', W); fo.setAttribute('height', H);
    fo.setAttribute('clip-path', `url(#cat-clip-${cat.id})`);
    fo.classList.add('cat-video-fo');
    const div = document.createElement('div'); div.setAttribute('xmlns','http://www.w3.org/1999/xhtml'); div.style.width = W + 'px'; div.style.height = H + 'px'; div.style.overflow='hidden';
    const vid = document.createElement('video'); vid.src = cat.src; vid.autoplay=true; vid.loop=true; vid.muted=true; vid.playsInline=true; vid.style.width = W + 'px'; vid.style.height = H + 'px'; vid.style.objectFit='cover'; vid.style.willChange='transform, opacity'; vid.style.transform='translateZ(0)'; vid.style.pointerEvents='none';
    div.appendChild(vid); fo.appendChild(div); g.appendChild(fo);
    svg.appendChild(g);
    categoryVideos[cat.id] = { group: g, fo, div, vid };
  }

  // --- create blobs (these groups sit ON TOP of category videos) ---
  blobs.forEach(b=>{
    const clip = document.createElementNS('http://www.w3.org/2000/svg','clipPath'); clip.setAttribute('id', 'v-clip-'+b.id); clip.setAttribute('clipPathUnits','userSpaceOnUse');
    const path = document.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('d',''); clip.appendChild(path); defs.appendChild(clip);

  const group = document.createElementNS('http://www.w3.org/2000/svg','g');
  group.style.transition='opacity 200ms ease, transform 180ms ease';
  // On mobile, keep blobs fully opaque
  group.style.opacity = isMobile() ? '1' : '0.5';
    group.style.transformOrigin = '50% 50%';
    group.style.transform = 'scale(1)';
    // NEW: убираем блюр с блопов
    // group.style.filter = 'url(#blob-blur)'; // удаляем эту строку
    group.classList.add('blob');

    const fo = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
    fo.setAttribute('x', 0); fo.setAttribute('y', 0); fo.setAttribute('width', W); fo.setAttribute('height', H);
    fo.setAttribute('clip-path', `url(#v-clip-${b.id})`);
    fo.style.pointerEvents = 'none';

    const div = document.createElement('div'); div.setAttribute('xmlns','http://www.w3.org/1999/xhtml'); div.style.width = W + 'px'; div.style.height = H + 'px'; div.style.overflow='hidden';
    const vid = document.createElement('video'); vid.src = (b.data && b.data.src) ? b.data.src : VIDEO_SOURCES[b.videoIndex]; vid.autoplay=true; vid.loop=true; vid.muted=true; vid.playsInline=true;
    vid.style.width = W + 'px'; vid.style.height = H + 'px'; vid.style.objectFit='cover'; vid.style.willChange = 'transform, opacity'; vid.style.transform = 'translateZ(0)'; vid.style.backfaceVisibility = 'hidden'; vid.style.pointerEvents = 'none'; vid.style.opacity = '1';
    vid.style.display = 'none'; vid.pause();
    div.appendChild(vid);
    fo.appendChild(div);

    // Контур (outline) блопа — отображает границу формы поверх фонового видео/изображения
    // Параметры и как их менять:
    //  - fill='none' — контур прозрачный внутри (контент виден через clipPath)
    //  - stroke: цвет границы задаётся формулой hsl(...) с небольшим сдвигом по id, чтобы получить разноцветные контуры
    //      * можно заменить на фиксированный цвет, например '#ffffff' или 'rgba(255,255,255,0.12)'
    //  - stroke-opacity: прозрачность обводки (0.16) — уменьшите для более тонкого эффекта
    //  - stroke-width: ширина обводки рассчитывается от радиуса блопа (b.r) — обеспечивает масштабируемость на разных размерах
    const outline = document.createElementNS('http://www.w3.org/2000/svg','path');
    outline.setAttribute('fill','none');
    outline.setAttribute('stroke', `hsl(${200 + (b.id*18)%140}, 78%, 58%)`);
    outline.setAttribute('stroke-opacity',0.16);
    outline.setAttribute('stroke-width', Math.max(2, Math.round(b.r*0.06)));
    // NEW: class and base metrics for restore
    outline.classList.add('blob-outline');
    b._baseStrokeOpacity = 0.16;
    b._baseStrokeWidth = Math.max(2, Math.round(b.r*0.06));
    // NEW: mark outline for CSS targeting
    outline.classList.add('blob-outline');

    group.appendChild(fo);
    group.appendChild(outline);

    // Текстовая метка внутри блопа
    //  - text-anchor / dominant-baseline: центрирование по X/Y
    //  - fill: цвет текста
    //  - opacity: по умолчанию 0 — появляется при hover
    //  - filter drop-shadow: даёт глубину и читабельность поверх видео
  const label = document.createElementNS('http://www.w3.org/2000/svg','text');
    label.classList.add('label'); // чтобы сработал CSS transition на opacity
    label.setAttribute('text-anchor','middle');
    label.setAttribute('dominant-baseline','middle');
    label.setAttribute('fill','#fff');
  // Always show labels on mobile devices
  label.setAttribute('opacity', isMobile() ? '1' : '0');
    label.style.filter='drop-shadow(0 6px 18px rgba(0,0,0,0.6))';
    // показываем реальное имя проекта, если есть
    label.textContent = (b.data && b.data.title) ? b.data.title : `Project ${b.id+1}`;
    group.appendChild(label);

    group.style.cursor = 'pointer';
    group.addEventListener('click', (e) => { e.stopPropagation(); try{ svg.appendChild(group); }catch(e){} const data = b.data; showDetail(data, b.id); });

    svg.appendChild(group);

    b.clipPathEl = path; b.pathEl = outline; b.fo = fo; b.group = group; b.outline = outline; b.label = label; b.div = div; b.localVideo = vid;
  });

  let _lastVoronoiInfos = null;
  let mode = 'overview';

  function smoothPolygon(points, iterations){ if(!points||points.length===0) return []; let pts = points.map(p=>[p[0],p[1]]); for(let k=0;k<iterations;k++){ const next=[]; const n=pts.length; for(let i=0;i<n;i++){ const p0=pts[i], p1=pts[(i+1)%n]; const Q=[p0[0]*0.75 + p1[0]*0.25, p0[1]*0.75 + p1[1]*0.25]; const R=[p0[0]*0.25 + p1[0]*0.75, p0[1]*0.25 + p1[1]*0.75]; next.push(Q); next.push(R);} pts=next;} return pts; }
  function centroid(points){ let x=0,y=0; for(const p of points){ x+=p[0]; y+=p[1]; } return [x/points.length, y/points.length]; }
  function maxDistToCenter(points,c){ let m=0; for(const p of points){ m=Math.max(m, Math.hypot(p[0]-c[0], p[1]-c[1])); } return m||0; }
  function insetPolygon(points, px){ const c=centroid(points); const avg=maxDistToCenter(points,c)||1; const factor=Math.max(0, 1 - (px / avg)); return points.map(p => [ c[0] + (p[0]-c[0]) * factor, c[1] + (p[1]-c[1]) * factor ]); }
  function expandPolygon(points, px){ const c=centroid(points); const avg=maxDistToCenter(points,c)||1; const factor=1 + (px / avg); return points.map(p => [ c[0] + (p[0]-c[0]) * factor, c[1] + (p[1]-c[1]) * factor ]); }
  function resamplePolygon(points,N){ const segs=[]; let total=0; for(let i=0;i<points.length;i++){ const a=points[i]; const b=points[(i+1)%points.length]; const l=Math.hypot(b[0]-a[0], b[1]-a[1]); segs.push({a,b,l}); total+=l; } if(total===0) return []; const step = total/N; const out=[]; let acc=0, si=0; for(let i=0;i<N;i++){ const target=i*step; while(target > acc + segs[si].l && si < segs.length-1){ acc += segs[si].l; si++; } const s=segs[si]; const t=(target-acc)/s.l; out.push([ s.a[0] + (s.b[0]-s.a[0]) * t, s.a[1] + (s.b[1]-s.a[1]) * t ]); } return out; }
  function polygonToPath(pts){ if(!pts||!pts.length) return ''; let s=`M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`; for(let i=1;i<pts.length;i++) s+= ` L ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`; s+=' Z'; return s; }
  function squarePolygon(cx,cy,side){ const h = side/2; return [[cx-h,cy-h],[cx+h,cy-h],[cx+h,cy+h],[cx-h,cy+h]]; }

  // --- NEW: helpers to stabilize polygon orientation and starting point ---
  function signedArea(pts){
    let a = 0;
    for(let i=0;i<pts.length;i++){
      const [x1,y1] = pts[i];
      const [x2,y2] = pts[(i+1)%pts.length];
      a += (x1*y2 - x2*y1);
    }
    return a * 0.5;
  }
  function normalizeRing(pts, prev){
    let out = pts.slice();

    // 1) Согласуем ориентацию: либо как у prev, либо фиксируем CCW.
    if(prev && prev.length){
      const curCW = signedArea(out) < 0;
      const prevCW = signedArea(prev) < 0;
      if(curCW !== prevCW) out = out.slice().reverse();
    }else{
      // фиксируем CCW (положительная площадь)
      if(signedArea(out) < 0) out = out.slice().reverse();
    }

    // 2) Совмещаем стартовую точку по ближайшей к prev[0]
    if(prev && prev.length){
      const [px,py] = prev[0];
      let bestIdx = 0, best = Infinity;
      for(let i=0;i<out.length;i++){
        const dx = out[i][0]-px, dy = out[i][1]-py;
        const d = dx*dx + dy*dy;
        if(d < best){ best = d; bestIdx = i; }
      }
      if(bestIdx > 0){
        out = out.slice(bestIdx).concat(out.slice(0,bestIdx));
      }
    }
    return out;
  }
  // -----------------------------------------------------------------------

  function computeVoronoiPaths(useDisp=true){
    // VORONOI CACHING: проверяем кэш перед вычислением
    const cacheKey = voronoiCache.createCacheKey(blobs, useDisp);
    const cached = voronoiCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Если нет значительного движения, возвращаем последний результат
    if (!voronoiCache.hasSignificantMovement(blobs, useDisp) && _lastVoronoiInfos) {
      return _lastVoronoiInfos;
    }
    
    const points = blobs.filter(b=>b.visible).map(b => useDisp ? [b.dispX, b.dispY] : [b.x, b.y]);
    if(points.length === 0) return blobs.map(b=>({path:'', pts:[]}));
    
    const visibleIndices = blobs.map((b,i)=> b.visible ? i : -1).filter(i=>i>=0);
    const delaunay = d3.Delaunay.from(points);
    const vor = delaunay.voronoi([0,0,W,H]);
    const out = [];
    for(let vi=0; vi<visibleIndices.length; vi++){
      const origIndex = visibleIndices[vi];
      const blob = blobs[origIndex];
      let poly = null;
      try{ poly = vor.cellPolygon(vi); }catch(e){ poly = null; }
      if(!poly || poly.length===0){ const circ=64; const pts=[]; for(let a=0;a<circ;a++){ const ang=(a/circ)*Math.PI*2; pts.push([blob.dispX + Math.cos(ang)*blob.r, blob.dispY + Math.sin(ang)*blob.r]); } poly = pts; }
      let smooth = smoothPolygon(poly, CHAIKIN_ITERS);
      smooth = insetPolygon(smooth, INSET_GAP);
      // Вот эта строка отвечает за "расширение" (офсет) блопа при наведении:
      const expandPx = blob.isHovered ? Math.max(10, blob.r * 0.3) : 0;
      if(expandPx > 0) smooth = expandPolygon(smooth, expandPx);
      const res = resamplePolygon(smooth, RESAMPLE_POINTS);
      const finalSmooth = smoothPolygon(res, 1);
      const finalRes = resamplePolygon(finalSmooth, RESAMPLE_FINAL);

      // НОРМАЛИЗАЦИЯ перед созданием path: устраняем флип
      const prevPts = blobs[origIndex].lastPath || null;
      const stable = normalizeRing(finalRes, prevPts);

      out.push({ path: polygonToPath(stable), pts: stable, origIndex });
    }
    const mapped = blobs.map(b=>({path:'', pts:[]}));
    for(const item of out){ mapped[item.origIndex] = { path: item.path, pts: item.pts }; }
    
    // VORONOI CACHING: сохраняем результат в кэш
    voronoiCache.set(cacheKey, mapped);
    _lastVoronoiInfos = mapped;
    
    return mapped;
  }

  // OPTIMIZATION: кэш для интерполяций путей
  const pathInterpolationCache = new Map();
  
  // VIDEO MASK OPTIMIZATION: кэширование видео трансформаций для синхронизации
  let _lastVideoTransforms = [];
  let _videoTransformUpdateFrame = 0;
  
  // DRAG OPTIMIZATION: throttling для плавного перетаскивания
  let _lastDragUpdate = 0;
  let _dragThrottleMs = 8; // ~120fps для плавного дрэга
  
  // SPATIAL HASHING OPTIMIZATION: сетка для быстрого поиска коллизий O(n log n)
  class SpatialHashGrid {
    constructor(cellSize = 100) {
      this.cellSize = cellSize;
      this.grid = new Map();
      this.lastUpdate = 0;
      this.updateThrottle = 16; // Обновляем сетку 60fps
    }
    
    // Получить ключ ячейки для координат
    getCellKey(x, y) {
      const cellX = Math.floor(x / this.cellSize);
      const cellY = Math.floor(y / this.cellSize);
      return `${cellX},${cellY}`;
    }
    
    // Обновить сетку с текущими позициями блопов
    update(blobs) {
      const now = performance.now();
      if (now - this.lastUpdate < this.updateThrottle) return;
      this.lastUpdate = now;
      
      this.grid.clear();
      
      for (const blob of blobs) {
        if (!blob.visible) continue;
        
        // Определяем какие ячейки занимает блоп (с учетом радиуса)
        const minX = blob.x - blob.r;
        const maxX = blob.x + blob.r;
        const minY = blob.y - blob.r;
        const maxY = blob.y + blob.r;
        
        const minCellX = Math.floor(minX / this.cellSize);
        const maxCellX = Math.floor(maxX / this.cellSize);
        const minCellY = Math.floor(minY / this.cellSize);
        const maxCellY = Math.floor(maxY / this.cellSize);
        
        // Добавляем блоп во все занимаемые ячейки
        for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
          for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
            const key = `${cellX},${cellY}`;
            if (!this.grid.has(key)) {
              this.grid.set(key, []);
            }
            this.grid.get(key).push(blob);
          }
        }
      }
    }
    
    // Получить потенциальные коллизии для блопа
    getNearbyBlobs(blob) {
      const nearby = new Set();
      
      // Проверяем все ячейки, которые может занимать блоп
      const minX = blob.x - blob.r;
      const maxX = blob.x + blob.r;
      const minY = blob.y - blob.r;
      const maxY = blob.y + blob.r;
      
      const minCellX = Math.floor(minX / this.cellSize);
      const maxCellX = Math.floor(maxX / this.cellSize);
      const minCellY = Math.floor(minY / this.cellSize);
      const maxCellY = Math.floor(maxY / this.cellSize);
      
      for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
        for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
          const key = `${cellX},${cellY}`;
          const cellBlobs = this.grid.get(key);
          if (cellBlobs) {
            for (const otherBlob of cellBlobs) {
              if (otherBlob !== blob && otherBlob.visible) {
                nearby.add(otherBlob);
              }
            }
          }
        }
      }
      
      return Array.from(nearby);
    }
  }
  
  // Создаем spatial hash grid
  const spatialGrid = new SpatialHashGrid(80); // Размер ячейки 80px
  
  // VORONOI CACHING OPTIMIZATION: умное кэширование Voronoi диаграмм
  class VoronoiCache {
    constructor() {
      this.cache = new Map();
      this.maxCacheSize = 20;
      this.positionThreshold = 2; // Минимальное смещение для пересчета
      this.lastPositions = new Map();
    }
    
    // Создает ключ на основе позиций блопов
    createCacheKey(blobs, useDisp = true) {
      const positions = blobs
        .filter(b => b.visible)
        .map(b => {
          const x = useDisp ? Math.round(b.dispX / this.positionThreshold) : Math.round(b.x / this.positionThreshold);
          const y = useDisp ? Math.round(b.dispY / this.positionThreshold) : Math.round(b.y / this.positionThreshold);
          return `${b.id}:${x},${y}`;
        })
        .sort() // Сортируем для консистентности
        .join('|');
      
      return `${positions}_${useDisp ? 'disp' : 'real'}`;
    }
    
    // Проверяет, значительно ли изменились позиции
    hasSignificantMovement(blobs, useDisp = true) {
      const currentKey = this.createCacheKey(blobs, useDisp);
      const lastKey = this.lastPositions.get(useDisp ? 'disp' : 'real');
      
      if (!lastKey || lastKey !== currentKey) {
        this.lastPositions.set(useDisp ? 'disp' : 'real', currentKey);
        return true;
      }
      
      return false;
    }
    
    get(key) {
      const cached = this.cache.get(key);
      if (cached) {
        // Обновляем время последнего использования
        cached.lastUsed = performance.now();
        return cached.data;
      }
      return null;
    }
    
    set(key, data) {
      // Ограничиваем размер кэша
      if (this.cache.size >= this.maxCacheSize) {
        // Удаляем самую старую запись
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [k, v] of this.cache.entries()) {
          if (v.lastUsed < oldestTime) {
            oldestTime = v.lastUsed;
            oldestKey = k;
          }
        }
        
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
      
      this.cache.set(key, {
        data: data,
        lastUsed: performance.now()
      });
    }
    
    clear() {
      this.cache.clear();
      this.lastPositions.clear();
    }
  }
  
  const voronoiCache = new VoronoiCache();
  
  function morphPath(el, newD, duration=MORPH_DURATION){ 
    const old = el.getAttribute('d') || newD; 
    if(old === newD) return; 
    
    let interp;
    try{ 
      interp = flubber.interpolate(old, newD, {maxSegmentLength:2}); 
    } catch(e){ 
      el.setAttribute('d', newD); 
      return; 
    }
    
    const start = performance.now(); 
    function frame(t){ 
      const p = Math.min(1,(t-start)/duration); 
      el.setAttribute('d', interp(p)); 
      if(p<1) requestAnimationFrame(frame); 
    } 
    requestAnimationFrame(frame); 
  }

  // SMOOTH MORPHING: Упрощенная функция морфинга как в рабочем примере
  function smartMorphPath(el, newD, blob, isForced = false) {
    // Проверяем, нужно ли изменение
    const currentD = el.getAttribute('d') || '';
    if (currentD === newD) return;
    
    // Используем простой морфинг с адаптивной длительностью
    let duration = MORPH_DURATION;
    
    if (dragging && dragging.b === blob) {
      // При перетаскивании - быстрее
      duration = 100;
    } else if (blob.vx * blob.vx + blob.vy * blob.vy > 0.01) {
      // При движении - быстрее
      duration = 150;
    } else if (isForced) {
      // Для принудительных обновлений - мгновенно
      el.setAttribute('d', newD);
      return;
    }
    
    // Используем стандартный морфинг
    morphPath(el, newD, duration);
  }

  // SMOOTH MORPHING: Упрощенный морфинг для видео
  function smoothMorphVideo(blob, newTransform) {
    const video = blob.localVideo;
    if (!video) return;
    
    // Проверяем, действительно ли нужно изменение
    if (video.style.transform === newTransform) return;
    
    // Простое мгновенное применение для стабильности
    video.style.transform = newTransform;
  }

  function circlePathStr(cx,cy,r,segments=32){ const pts = []; for(let i=0;i<segments;i++){ const a = (i/segments)*Math.PI*2; pts.push([cx + Math.cos(a)*r, cy + Math.sin(a)*r]); } return polygonToPath(pts); }

  let lastCompute = 0;
  function recomputeAndRender(forceImmediate=false){
    // PERFORMANCE MONITORING: проверяем возможность пропуска кадра
    if (window.performanceMonitor && window.performanceMonitor.shouldSkipFrame() && !forceImmediate) {
      console.log('⏭️ Skipping frame due to poor performance');
      return;
    }
    
    const renderStartTime = performance.now();
    const now = performance.now();
    
    // SMART THROTTLING: менее агрессивный throttling для морфинга каждый кадр
    const effectiveInterval = forceImmediate ? 0 : Math.max(16, window.RECOMPUTE_INTERVAL);
    if(!forceImmediate && now - lastCompute < effectiveInterval) return; 
    lastCompute = now;
    const infos = computeVoronoiPaths(true);
    _lastVoronoiInfos = infos;
    
    // --- update category clips
    for(const cat of categories){ const clip = categoryClips[cat.id]; clip.innerHTML = ''; for(let i=0;i<blobs.length;i++){ const b = blobs[i]; if(b.category === cat.id && b.visible && !b._excludeFromCategoryClip){ const info = infos[i]; if(info){ const pathD = (b.isFrozen && b.frozenPath) ? b.frozenPath : info.path; if(pathD){ const p = document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d', pathD); clip.appendChild(p); } } } } }
    for(let i=0;i<blobs.length;i++){
      const b = blobs[i];
      const info = infos[i];
      const clip = b.clipPathEl;
      const outline = b.pathEl;
      const fo = b.fo;
      const group = b.group;
      if(!b.visible){ group.style.display='none'; continue;} else { group.style.display=''; }
      
      if(b.isHovered && b.isFrozen){ 
        if(b.frozenPath){ try{ clip.setAttribute('d', b.frozenPath); outline.setAttribute('d', b.frozenPath); }catch(e){} } 
        group.style.opacity = '1'; 
        b.label.setAttribute('opacity','1'); 
        
        // NEW: улучшенная логика позиционирования и размера текста
        if(b.frozenLabel){ 
          // Используем сохраненные координаты и размер из frozenLabel
          b.label.setAttribute('x', b.frozenLabel.x); 
          b.label.setAttribute('y', b.frozenLabel.y); 
          b.label.setAttribute('font-size', b.frozenLabel.fontSize + 'px');
        } else if(info && info.pts){ 
          // Fallback: вычисляем на основе текущих точек полигона
          const c = centroid(info.pts); 
          const maxDist = maxDistToCenter(info.pts, c);
          
          // NEW: адаптивный размер шрифта с ограничениями
          const baseFontSize = Math.max(10, Math.min(24, maxDist * 0.15));
          const fontSize = Math.round(baseFontSize);
          
          // NEW: проверяем границы экрана для позиции текста
          const safeX = Math.max(50, Math.min(W - 50, c[0]));
          const safeY = Math.max(30, Math.min(H - 30, c[1]));
          
          b.label.setAttribute('x', safeX); 
          b.label.setAttribute('y', safeY); 
          b.label.setAttribute('font-size', fontSize + 'px'); 
        } 
        
        if(b.frozenVideoTransform !== undefined){ const vid = b.fo.querySelector('video'); if(vid) vid.style.transform = b.frozenVideoTransform; } 
        continue; 
      }
      
      if(info && info.path){
        if(forceImmediate){
          try{ b.clipPathEl.setAttribute('d', info.path); b.pathEl.setAttribute('d', info.path); }catch(e){}
        } else {
          // Используем простой морфинг как в рабочем примере
          morphPath(b.clipPathEl, info.path, MORPH_DURATION);
          morphPath(b.pathEl, info.path, MORPH_DURATION);
        }
      }
      // Важно: сохраняем уже нормализованные точки — это ключ к стабильности между кадрами
      b.lastPath = info ? info.pts : null;
      if(info && info.pts && info.pts.length){ 
        const c = centroid(info.pts); 
        b.label.setAttribute('x', c[0]); 
        b.label.setAttribute('y', c[1]); 
      }
  const fontSize = Math.max(6, Math.round(b.r * 0.2)); // уменьшаем базовый размер шрифта
  b.label.setAttribute('font-size', fontSize + 'px');
  // On mobile, blobs and labels stay fully visible regardless of hover state
  group.style.opacity = isMobile() ? '1' : (b.isHovered ? '1' : '0.5');
  b.label.setAttribute('opacity', isMobile() ? '1' : (b.isHovered ? '1' : '0')); // плавность обеспечит CSS transition
      // NEW: управляем блюром заднего фона через глобальную переменную
      if (b.isHovered) {
        b.group.classList.add('hovered');
        // убираем блюр с самого блопа, применяем свечение
        b.group.style.filter = 'url(#blob-glow)';
      } else {
        b.group.classList.remove('hovered');
        // убираем фильтр с блопа
        b.group.style.filter = 'none';
      }
      b.lastPath = info ? info.pts : null;
    }

    // Гарантируем, что hovered всегда верхний и текст поверх контента FO
    if (hovered && hovered.group && hovered.group.parentNode === svg) {
      svg.appendChild(hovered.group);
      if (hovered.fo && hovered.fo.parentNode === hovered.group) {
        hovered.group.appendChild(hovered.fo);
      }
      if (hovered.label && hovered.label.parentNode === hovered.group) {
        hovered.group.appendChild(hovered.label); // держим текст поверх FO
      }
    }
    
    // PERFORMANCE MONITORING: записываем время рендеринга
    if (window.performanceMonitor) {
      const renderTime = performance.now() - renderStartTime;
      window.performanceMonitor.metrics.renderTime = renderTime;
      window.performanceMonitor.metrics.blobCount = blobs.length;
      
      // Адаптивная настройка интервала
      if (renderTime > 20) {
        window.RECOMPUTE_INTERVAL = Math.min(window.RECOMPUTE_INTERVAL + 2, 100);
      } else if (renderTime < 8 && window.RECOMPUTE_INTERVAL > 16) {
        window.RECOMPUTE_INTERVAL = Math.max(window.RECOMPUTE_INTERVAL - 1, 16);
      }
    }
  }

  // Добавляем специальную длительность для hover-анимации
  const HOVER_MORPH_DURATION = 300; // немного уменьшить длительность для более отзывчивой анимации

  function enterOverviewMode(){
    mode = 'overview';
    for(const cat of categories){ const kv = categoryVideos[cat.id]; kv.group.style.display = ''; kv.vid.play && kv.vid.play(); }
    for(const b of blobs){ const vid = b.localVideo; if(vid){ vid.style.display = 'none'; try{ vid.pause(); }catch(e){} } const img = b.fo.querySelector('img.blob-image'); if(img) img.remove(); b.visible = true; b.group.style.display = ''; }
  }

  function enterFilteredMode(matches){
    mode = 'filtered';
    for(const cat of categories){ const kv = categoryVideos[cat.id]; kv.group.style.display = 'none'; try{ kv.vid.pause(); }catch(e){} }
    for(const b of blobs){ const vid = b.localVideo; if(vid){ vid.style.display = 'none'; try{ vid.pause(); }catch(e){} } const isMatch = matches.indexOf(b) >= 0; if(isMatch){ if(!b.fo.querySelector('img.blob-image')){ const img = document.createElement('img'); img.className = 'blob-image'; img.src = (b.data && b.data.imgs && b.data.imgs[0]) || b.imageSrc || ''; img.style.width = W + 'px'; img.style.height = H + 'px'; img.style.objectFit = 'cover'; img.style.opacity = '0'; img.style.transition = 'opacity 300ms ease'; b.div.appendChild(img); requestAnimationFrame(()=>{ img.style.opacity = '1'; }); } b.visible = true; b.group.style.display = ''; } else { const img = b.fo.querySelector('img.blob-image'); if(img) img.remove(); } }
  }

  function updateVideoTransforms(){
    const infos = _lastVoronoiInfos || computeVoronoiPaths(true);
    
    // VIDEO MASK OPTIMIZATION: кэшируем трансформации для согласованности
    for(let i=0;i<blobs.length;i++){
      const b = blobs[i]; 
      if(!b.visible) continue; 
      const info = infos[i]; 
      const vid = b.localVideo; 
      if(!vid) continue; 
      
      // DRAGGING STABILITY: При перетаскивании фиксируем видео трансформацию
      if(dragging && dragging.b === b) {
        // Если блоп перетаскивается - используем зафиксированную трансформацию
        if(!b._dragVideoTransform && b.frozenVideoTransform) {
          // Используем frozenVideoTransform как основу для зафиксированной трансформации
          b._dragVideoTransform = b.frozenVideoTransform;
        }
        if(b._dragVideoTransform && vid.style.transform !== b._dragVideoTransform) {
          vid.style.transform = b._dragVideoTransform;
        }
        if(b._dragVideoTransform) {
          _lastVideoTransforms[i] = b._dragVideoTransform;
        }
        continue;
      } else {
        // Очищаем зафиксированную трансформацию если перетаскивание закончилось
        if(b._dragVideoTransform) {
          delete b._dragVideoTransform;
        }
      }
      
      let cx = b.dispX, cy = b.dispY, maxD = Math.max(32, b.r); 
      
      if(info && info.pts && info.pts.length){ 
        const cc = centroid(info.pts); 
        cx = cc[0]; 
        cy = cc[1]; 
        maxD = Math.max(32, maxDistToCenter(info.pts, cc)); 
      } 
      
      const pad = VIDEO_PADDING; 
      const side = Math.ceil(maxD*2 + pad*2); 
      const desired = Math.max(32, side); 
      const scale = Math.min(2, Math.max(0.6, W / (desired * 1.15))); 
      const tx = Math.round(W/2 - cx); 
      const ty = Math.round(H/2 - cy); 
      const transform = `translate(${tx}px, ${ty}px) scale(${scale})`; 
      
      // Кэшируем трансформацию для данного фрейма
      if (!_lastVideoTransforms[i]) _lastVideoTransforms[i] = '';
      
      if(b.frozenVideoTransform !== undefined && b.frozenVideoTransform !== null){ 
        if(vid.style.transform !== b.frozenVideoTransform) {
          vid.style.transform = b.frozenVideoTransform;
          _lastVideoTransforms[i] = b.frozenVideoTransform;
        }
      } else { 
        if(vid.style.transform !== transform) {
          vid.style.transform = transform;
          _lastVideoTransforms[i] = transform;
        }
      } 
    }
  }
  
  // VIDEO MASK OPTIMIZATION: интерполированное обновление видео между recompute
  function updateVideoTransformsSmooth(){
    for(let i=0;i<blobs.length;i++){
      const b = blobs[i]; 
      if(!b.visible) continue; 
      const vid = b.localVideo; 
      if(!vid) continue; 
      
      // Если есть frozen transform, не интерполируем
      if(b.frozenVideoTransform !== undefined && b.frozenVideoTransform !== null) continue;
      
      // DRAGGING STABILITY: При перетаскивании используем зафиксированную трансформацию
      if(dragging && dragging.b === b && b._dragVideoTransform) {
        if(vid.style.transform !== b._dragVideoTransform) {
          vid.style.transform = b._dragVideoTransform;
        }
        continue;
      }
      
      // Используем текущие dispX/dispY для плавного следования за блопом
      let cx = b.dispX, cy = b.dispY, maxD = Math.max(32, b.r);
      
      const pad = VIDEO_PADDING; 
      const side = Math.ceil(maxD*2 + pad*2); 
      const desired = Math.max(32, side); 
      const scale = Math.min(2, Math.max(0.6, W / (desired * 1.15))); 
      const tx = Math.round(W/2 - cx); 
      const ty = Math.round(H/2 - cy); 
      const smoothTransform = `translate(${tx}px, ${ty}px) scale(${scale})`; 
      
      // Простое применение без transitions
      const currentTransform = vid.style.transform || '';
      if(currentTransform !== smoothTransform) {
        vid.style.transform = smoothTransform;
      }
    }
  }
  
  // DRAG OPTIMIZATION: синхронное обновление видео для перетаскиваемого блопа
  function updateDraggedVideoTransform(draggedBlob) {
    if (!draggedBlob || !draggedBlob.localVideo) return;
    
    const b = draggedBlob;
    const lv = b.localVideo;
    
    if (mode === 'overview' && lv && lv.style.display !== 'none') {
      // ВАЖНО: Используем замороженную трансформацию для стабильности видео
      if (b.frozenVideoTransform) {
        // Применяем зафиксированную в начале перетаскивания трансформацию
        if (lv.style.transform !== b.frozenVideoTransform) {
          lv.style.transform = b.frozenVideoTransform;
        }
        
        // Кэшируем для последующего использования
        const blobIndex = blobs.indexOf(b);
        if (blobIndex >= 0) {
          if (!_lastVideoTransforms[blobIndex]) _lastVideoTransforms[blobIndex] = '';
          _lastVideoTransforms[blobIndex] = b.frozenVideoTransform;
        }
      }
    }
  }

  function physicsStep(){
    const physicsStart = performance.now();
    
    // SPATIAL OPTIMIZATION: обновляем spatial grid для быстрого поиска коллизий
    spatialGrid.update(blobs);
    
    // 1. Обновляем физику движения для всех блопов
    for(const b of blobs){ 
      if(!b.isHovered && !b.isFrozen && b.visible){ 
        b.vx *= 0.94; 
        b.vy *= 0.94; 
        b.vx += Math.sin((performance.now()/1000)+b.id*0.9) * IDLE_AMPLITUDE; 
        b.vy += Math.cos((performance.now()/1000)+b.id*1.1) * IDLE_AMPLITUDE; 
        b.x += b.vx; 
        b.y += b.vy; 
      } 
      
      // Границы экрана
      const gap = 8; 
      if(b.x - b.r < gap){ b.x = gap + b.r; b.vx *= -0.42; } 
      if(b.x + b.r > W - gap){ b.x = W - gap - b.r; b.vx *= -0.42; } 
      if(b.y - b.r < gap){ b.y = gap + b.r; b.vy *= -0.42; } 
      if(b.y + b.r > H - gap){ b.y = H - gap - b.r; b.vy *= -0.42; } 
    }
    
    // 2. SPATIAL OPTIMIZATION: коллизии через spatial hashing вместо O(n²)
    const processedPairs = new Set();
    
    for(const A of blobs) {
      if (!A.visible) continue;
      
      // Получаем только ближайшие блопы через spatial grid
      const nearbyBlobs = spatialGrid.getNearbyBlobs(A);
      
      for(const B of nearbyBlobs) {
        if (!B.visible || A === B) continue;
        
        // Избегаем дублирования пар (A,B) и (B,A)
        const pairKey = A.id < B.id ? `${A.id}-${B.id}` : `${B.id}-${A.id}`;
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);
        
        // Проверяем коллизию
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        const min = A.r + B.r + CENTER_GAP;
        
        if(d < min) {
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
    
    // 3. Устанавливаем целевые позиции
    for(const b of blobs){ 
      b.targetX = b.x; 
      b.targetY = b.y; 
    }
    
    // DEBUG: логируем время выполнения физики
    const physicsTime = performance.now() - physicsStart;
    if(physicsTime > 5) {
      console.warn(`🐌 Slow physics: ${physicsTime.toFixed(2)}ms`);
    }
  }

  function updateDisplayPositions(){ for(const b of blobs){ b.dispX += (b.targetX - b.dispX) * DISPLAY_LERP; b.dispY += (b.targetY - b.dispY) * DISPLAY_LERP; } }
  
  let hovered = null;
  
  // NEW: функция для управления блюром заднего фона
  function updateBackgroundBlur() {
    const brandBg = document.getElementById('brandBg');
    if (!brandBg) return;
    
    // если есть активный hovered блоп - убираем блюр, иначе применяем
    if (hovered && hovered.isHovered) {
      brandBg.style.filter = 'none';
      brandBg.style.transition = 'filter 200ms ease';
    } else {
      brandBg.style.filter = 'url(#background-blur)';
      brandBg.style.transition = 'filter 200ms ease';
    }
  }

  // TOUCH OPTIMIZATION: throttling для hover событий
  let _lastHoverUpdate = 0;
  let _hoverThrottleMs = 16; // ~60fps для hover
  
  function throttledHoverHandler(e) {
    const now = performance.now();
    if (now - _lastHoverUpdate < _hoverThrottleMs) return;
    _lastHoverUpdate = now;
    
    if(dragging) return; 
    const rect = svg.getBoundingClientRect(); 
    const mx = e.clientX - rect.left, my = e.clientY - rect.top; 

    // 1) Сначала пробуем hit-test по текущим полигонам (последние вычисленные пути)
    const infos = _lastVoronoiInfos || computeVoronoiPaths(true);
    let found = null;

    for(let i=0;i<blobs.length;i++){
      const b = blobs[i];
      if(!b.visible) continue;
      const info = infos[i];
      const pts = info && info.pts;
      if(pts && pts.length > 2){
        if(pointInPolygon(mx, my, pts)){
          found = b;
          break; // Voronoi ячейки не пересекаются — можно выйти
        }
      }
    }

    // 2) Если полигон пока не готов/курсор в зазоре — fallback по близости к центру (как было раньше)
    if(!found){
      let best = null, bestD = 1e9;
      for(const b of blobs){
        if(!b.visible) continue;
        const dx = b.dispX - mx, dy = b.dispY - my;
        const d = Math.hypot(dx, dy);
        if(d < bestD && d < b.r * 1.2){ best = b; bestD = d; }
      }
      found = best;
    }

    // ...ниже — существующая логика реакции на смену hovered/leave...
    if(found && hovered !== found){ 
      if(hovered){ 
        // При уходе с блопа - морфим контур обратно с анимацией
        try {
          const infosNow = _lastVoronoiInfos || computeVoronoiPaths(true);
          const info = infosNow[hovered.id];
          if(info && info.path) {
            morphPath(hovered.clipPathEl, info.path, 300);
            morphPath(hovered.pathEl, info.path, 300);
          }
        } catch(err){}
        hovered.frozenVideoTransform = null; 
        hovered.frozenLabel = null; 
        hovered.isHovered = false; 
        hovered.isFrozen = false; 
        hovered.hoverExpanded = 0; 
        hovered.snapStart = 0; 
      } 
      hovered = found; 
      hovered.isHovered = true; 
      hovered.isFrozen = true; 
      hovered.hoverExpanded = 1; 
      hovered.snapStart = performance.now(); 
      hovered.snapFrom = {x: hovered.targetX, y: hovered.targetY}; 
      hovered.snapTo = {x: mx, y: my}; 
      hovered.targetX = mx; 
      hovered.targetY = my; 
      hovered.vx = 0; 
      hovered.vy = 0; 
      if (hovered.fo && hovered.fo.parentNode === hovered.group) hovered.group.appendChild(hovered.fo);
      if (hovered.label && hovered.label.parentNode === hovered.group) hovered.group.appendChild(hovered.label);
      
      try{ 
        const infosNow = _lastVoronoiInfos || computeVoronoiPaths(true); 
        const infoForHover = infosNow[hovered.id]; 
        if(infoForHover){ 
          morphPath(hovered.clipPathEl, infoForHover.path, 300);
          morphPath(hovered.pathEl, infoForHover.path, 300);
          hovered.frozenPath = infoForHover.path;
          
          const c = centroid(infoForHover.pts); 
          const maxD = maxDistToCenter(infoForHover.pts, c); 
          
          // NEW: улучшенная логика для frozenLabel
          // Определяем размер шрифта на основе размера полигона с четкими ограничениями
          const baseFontSize = Math.max(12, Math.min(28, maxD * 0.18));
          const fontSize = Math.round(baseFontSize);
          
          // NEW: более умное позиционирование с учетом размера текста
          const textWidth = hovered.label.textContent.length * fontSize * 0.6; // примерная ширина
          const textHeight = fontSize;
          
          // Проверяем и корректируем позицию, чтобы текст не выходил за границы
          let safeX = c[0];
          let safeY = c[1];
          
          // Проверка по X (горизонтально)
          if (safeX - textWidth/2 < 20) {
            safeX = 20 + textWidth/2;
          } else if (safeX + textWidth/2 > W - 20) {
            safeX = W - 20 - textWidth/2;
          }
          
          // Проверка по Y (вертикально)
          if (safeY - textHeight/2 < 20) {
            safeY = 20 + textHeight/2;
          } else if (safeY + textHeight/2 > H - 20) {
            safeY = H - 20 - textHeight/2;
          }
          
          hovered.frozenLabel = { 
            x: safeX, 
            y: safeY, 
            fontSize: fontSize 
          };
          
          const pad = VIDEO_PADDING; 
          const side = Math.ceil(maxD*2 + pad*2); 
          const scale = Math.min(2, Math.max(0.6, W / (Math.max(32, side) * 1.15))); 
          const tx = Math.round(W/2 - c[0]); 
          const ty = Math.round(H/2 - c[1]); 
          hovered.frozenVideoTransform = `translate(${tx}px, ${ty}px) scale(${scale})`; 
        } 
      }catch(err){} 
      
      // NEW: обновляем блюр заднего фона
      updateBackgroundBlur();
      recomputeAndRender(false); 
    } else if(!found && hovered){ 
      hovered.frozenVideoTransform=null; 
      hovered.frozenLabel=null; 
      hovered.isHovered=false; 
      hovered.isFrozen=false; 
      hovered.hoverExpanded=0; 
      hovered.frozenPath = null; 
      hovered.snapStart=0; 
      hovered=null; 
      
      // NEW: обновляем блюр заднего фона
      updateBackgroundBlur();
      recomputeAndRender(false); 
    } 
  }

  // TOUCH OPTIMIZATION: добавляем throttled обработчик с passive listener
  svg.addEventListener('pointermove', throttledHoverHandler, { passive: true });

  svg.addEventListener('pointerleave', ()=>{ 
    if(hovered){ 
      hovered.frozenVideoTransform=null; 
      hovered.frozenLabel=null; 
      hovered.isHovered=false; 
      hovered.isFrozen=false; 
      hovered.hoverExpanded=0; 
      hovered.frozenPath=null; 
      hovered=null; 
      
      // NEW: обновляем блюр заднего фона
      updateBackgroundBlur();
      recomputeAndRender(false);
    } 
  }, { passive: true }); // TOUCH OPTIMIZATION: passive listener

  let dragging = null;
  let allowDragging = true;
  // TOUCH OPTIMIZATION: passive: false для pointerdown - нужен preventDefault
  svg.addEventListener('pointerdown', (e)=>{
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    // NEW: сначала ищем блоп по попаданию точки в его текущий полигон
    let best = null;
    try {
      const infos = _lastVoronoiInfos || computeVoronoiPaths(true);
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        if (!b.visible) continue;
        const info = infos[i];
        const pts = info && info.pts;
        if (pts && pts.length > 2 && pointInPolygon(mx, my, pts)) {
          best = b;
          break;
        }
      }
    } catch(_) {}

    // Fallback: если не попали в полигон — используем прежний поиск по расстоянию до центра
    if (!best) {
      let bestD = 1e9;
      for (const b of blobs) {
        if (!b.visible) continue;
        const d = Math.hypot(b.dispX - mx, b.dispY - my);
        if (d < bestD && d < b.r * 1.2) { best = b; bestD = d; }
      }
    }

    if(best){ // prepare dragging
      dragging = { b: best, ox: mx - best.dispX, oy: my - best.dispY, dragStarted: false, startX: mx, startY: my, draggingDisabled: !allowDragging };
      // Freeze the blob so its clip/outlines don't jitter
      best.isHovered = false; best.isFrozen = true; svg.appendChild(best.group); best._pointerDownTime = performance.now(); best._movedDuringDown = false;
      
      // DRAG OPTIMIZATION: добавляем CSS класс для отключения transitions
      document.body.classList.add('dragging');
      
      try{
        // compute an initial video transform for the blob so local video appears positioned correctly
        const infos = computeVoronoiPaths(true);
        const info = infos[best.id];
        let cx = best.dispX, cy = best.dispY, maxD = Math.max(32, best.r);
        if(info && info.pts && info.pts.length){ const c = centroid(info.pts); cx = c[0]; cy = c[1]; maxD = Math.max(32, maxDistToCenter(info.pts, c)); }
        const pad = VIDEO_PADDING; const side = Math.ceil(maxD*2 + pad*2); const desired = Math.max(32, side); const scale = Math.min(2, Math.max(0.6, W / (desired * 1.15))); const tx = Math.round(W/2 - cx); const ty = Math.round(H/2 - cy); best.frozenVideoTransform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        // in overview mode, exclude only this blob from the category clip and show local video
        if(mode === 'overview'){
          best._excludeFromCategoryClip = true;
          const lv = best.localVideo; if(lv){ lv.style.display = ''; lv.style.transform = best.frozenVideoTransform; try{ lv.play(); }catch(e){} }
        }
      }catch(err){}
    }
  });

  // TOUCH OPTIMIZATION: passive: false для drag move - нужен preventDefault
  window.addEventListener('pointermove', (e)=>{ 
    if(!dragging) return; 
    if(dragging.draggingDisabled) return; 
    
    const now = performance.now();
    
    const rect = svg.getBoundingClientRect(); 
    const mx = e.clientX - rect.left, my = e.clientY - rect.top; 
    const dx = mx - dragging.startX, dy = my - dragging.startY; 
    
    if(!dragging.dragStarted && Math.hypot(dx,dy) > 6){ 
      dragging.dragStarted = true; 
      dragging.b._movedDuringDown = true; 
    } 
    
    // DRAG OPTIMIZATION: обновляем позицию блопа немедленно
    dragging.b.targetX = mx - dragging.ox; 
    dragging.b.targetY = my - dragging.oy; 
    dragging.b.x = dragging.b.targetX; 
    dragging.b.y = dragging.b.targetY; 
    dragging.b.vx = 0; 
    dragging.b.vy = 0; 
    
    // DRAG OPTIMIZATION: мгновенно обновляем видео для синхронизации
    updateDraggedVideoTransform(dragging.b);
    
    // DRAG OPTIMIZATION: throttling для recomputeAndRender
    if (now - _lastDragUpdate >= _dragThrottleMs) {
      recomputeAndRender(false);
      _lastDragUpdate = now;
    }
  }, { passive: false }); // TOUCH OPTIMIZATION: passive: false для drag - нужен preventDefault
  
  // TOUCH OPTIMIZATION: passive listener для pointerup
  window.addEventListener('pointerup', ()=>{ 
    if(dragging){ 
      const b = dragging.b; 
      
      // DRAG OPTIMIZATION: убираем CSS класс дрэга
      document.body.classList.remove('dragging');
      
      if(!dragging.dragStarted && b._pointerDownTime && (performance.now() - b._pointerDownTime) < 350){ 
        const data = b.data; 
        showDetail(data); 
      }
      // restore category group visibility if we hid it during drag
      try{ if(b._excludeFromCategoryClip){ delete b._excludeFromCategoryClip; recomputeAndRender(true); } }catch(e){}
      // hide and pause the local video used for dragging
      try{ const lv = b.localVideo; if(lv){ lv.style.display = 'none'; try{ lv.pause(); }catch(e){} lv.style.transform = ''; } }catch(e){}
      // DRAG FIX: очищаем все состояния перетаскивания
      if(b.frozenVideoTransform) delete b.frozenVideoTransform;
      if(b._dragVideoTransform) delete b._dragVideoTransform;
      b.frozenFO = null; b.frozenLabel = null; b.isFrozen = false; recomputeAndRender(false); 
    } 
    dragging = null; 
  }, { passive: true }); // TOUCH OPTIMIZATION: passive listener для pointerup

  let last = performance.now(); let running = true; let frameCount = 0;
  // OPTIMIZATION: уменьшаем частоту пересчета Voronoi с каждого 2-го на каждый 4-й фрейм
  // VIDEO MASK OPTIMIZATION: исправлен порядок обновлений для синхронизации масок и видео
  function loop(now){ 
    const dt = now - last; 
    last = now; 
    
    if(running){ 
      physicsStep(); 
      updateDisplayPositions(); 
      
      // SMOOTH ANIMATION: recompute каждый кадр для плавности, но video только каждые 4 кадра
      recomputeAndRender(false);
      
      // ANTI-JITTER: Оптимизированное обновление видео для устранения подергиваний
      if(frameCount % 6 === 0) {
        // Менее частое полное обновление для стабильности
        updateVideoTransforms(); // Полное обновление с Voronoi данными
      } else if(frameCount % 2 === 0) {
        // Интерполированное обновление каждый второй кадр
        updateVideoTransformsSmooth(); // Интерполированное обновление между recompute
      }
      // В остальных кадрах видео не обновляется для предотвращения микроподергиваний
    } 
    
    frameCount++; 
    requestAnimationFrame(loop); 
  }
  requestAnimationFrame(loop);

  (function(){ const btn = document.getElementById('resetBtn'); if(btn){ btn.addEventListener('click', ()=>{ for(const b of blobs){ b.x = Math.random()*(W*0.8)+W*0.1; b.y = Math.random()*(H*0.5)+H*0.1; b.vx=b.vy=0; b.isHovered=false; b.isFrozen=false; b.targetX=b.x; b.targetY=b.y; b.dispX=b.x; b.dispY=b.y; b.frozenFO=null; b.frozenLabel=null; if(b.frozenVideoTransform !== undefined){ const v = b.fo.querySelector('video'); if(v) v.style.transition = ''; delete b.frozenVideoTransform; } b.visible=true; b.gridMode=false; } recomputeAndRender(true); }); } })();

  // connect filter UI
  // ...existing code that was wiring filter clicks and search input...
  // Moved to ui.js:
  //   - debounce()
  //   - filterSpans click handlers
  //   - searchInput input handler

  // Restore: grid layout for matches (used by applyFilter)
  function layoutTargetsForMatches(matches){
    const count = matches.length; if(count === 0) return;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const pad = 24;
    const usableW = Math.max(200, W - pad*2);
    const usableH = Math.max(200, H - pad*2);
    const cellW = usableW / cols;
    const cellH = usableH / rows;
    let idx = 0;
    for(const b of matches){
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const tx = pad + cellW * col + cellW/2;
      const ty = pad + cellH * row + cellH/2;
      b.targetX = tx; b.targetY = ty;
      b.x = b.targetX; b.y = b.targetY;
      b.dispX = b.targetX; b.dispY = b.targetY;
      b.r = Math.min(Math.max(40, Math.min(cellW, cellH) * 0.35), Math.max(40, Math.min(W,H)*0.22));
      idx++;
    }
  }

  // Restore: toggle active state on filter buttons
  function setActiveFilter(filterName){
    const spans = document.querySelectorAll('#filterBar .filters span');
    spans.forEach(s => {
      if (s.dataset.filter === filterName) s.classList.add('active');
      else s.classList.remove('active');
    });
  }

  // Restore: main filter logic (buttons and search)
  function applyFilter(rawKey){
    clearPending();
    const key = (rawKey||'').toString().trim().toLowerCase();
    MORPH_DURATION = 600; // general morph time during transitions

    const hideMs = 300;
    const birthMs = 520;

  if(!key || key === 'all'){
      // reset to overview
      running = true;
      allowDragging = true;
      IDLE_AMPLITUDE = DEFAULT_IDLE_AMPLITUDE;
      setActiveFilter('all');

      for(const b of blobs){
        b.visible = true;
        b.group.style.display = '';
        b.group.style.transition = `opacity ${hideMs}ms ease`;
        // Keep opaque on mobile, semi-transparent otherwise
        b.group.style.opacity = isMobile() ? '1' : '0.5';
        b.isFrozen = false;
        b.frozenPath = null;
        b.frozenVideoTransform = null;
      }
      // remove per-blob images
      for(const b of blobs){
        const img = b.fo.querySelector('img.blob-image');
        if(img) img.remove();
      }
      // show category videos
      enterOverviewMode();

      setTimeout(()=>{ recomputeAndRender(true); MORPH_DURATION = 300; }, 80);
      return;
    }

    // filtered mode: reduce motion and disable dragging
    running = true;
    allowDragging = false;
    IDLE_AMPLITUDE = Math.max(0, DEFAULT_IDLE_AMPLITUDE * 0.5);

    // determine matches
    const matches = blobs.filter(b => {
      const t = (b.data && b.data.title) ? b.data.title.toLowerCase() : '';
      return (b.data && b.data.category === key) || t.indexOf(key) >= 0;
    });

    // hide non-matches, tiny morph
    for(const b of blobs){
      const isMatch = matches.indexOf(b) >= 0;
      b.group.style.transition = `opacity ${hideMs}ms ease`;
      if(!isMatch){
        const tiny = circlePathStr(b.dispX, b.dispY, 2, 16);
        try{ morphPath(b.clipPathEl, tiny, hideMs); morphPath(b.pathEl, tiny, hideMs); }catch(e){}
        b.group.style.opacity = '0';
        const tid = setTimeout(()=>{ b.visible = false; b.group.style.display = 'none'; }, hideMs + 30);
        _pendingTimeouts.push(tid);
      } else {
        // prepare matches: ensure visible and centerTiny birth
        b.visible = true;
        b.group.style.display = '';
        b.group.style.opacity = '0';
        b.group.style.transform = 'scale(0.01)';
        const centerTiny = circlePathStr(W/2, H/2, 2, 16);
        try{ b.clipPathEl.setAttribute('d', centerTiny); b.pathEl.setAttribute('d', centerTiny); }catch(e){}
      }
    }

    // place matches into grid and insert images
    layoutTargetsForMatches(matches);
    for(const b of matches){
      if(!b.fo.querySelector('img.blob-image')){
        const img = document.createElement('img');
        img.className = 'blob-image';
        img.src = (b.data && b.data.imgs && b.data.imgs[0]) || b.imageSrc || '';
        img.style.width = W + 'px';
        img.style.height = H + 'px';
        img.style.objectFit = 'cover';
        img.style.opacity = '0';
        img.style.transition = 'opacity 360ms ease';
        b.div.appendChild(img);
        requestAnimationFrame(()=>{ img.style.opacity = '1'; });
      }
    }

    // recompute voronoi with only matches and morph from center
    const infos = computeVoronoiPaths(true);
    for(const b of matches){
      const info = infos[b.id];
      if(info && info.path){
        const centerTiny = circlePathStr(W/2, H/2, 2, 16);
  try{ morphPath(b.clipPathEl, info.path, birthMs); morphPath(b.pathEl, info.path, birthMs); }catch(e){}
  b.group.style.transition = `transform ${birthMs}ms cubic-bezier(.2,.9,.2,1), opacity ${birthMs}ms ease`;
  const tid2 = setTimeout(()=>{ b.group.style.transform = 'scale(1)'; b.group.style.opacity = isMobile() ? '1' : '0.95'; }, 10);
        _pendingTimeouts.push(tid2);
      }
    }

    // switch to filtered mode visuals
    enterFilteredMode(matches);
  }

  // Expose API for ui.js
  window.BlobsApp = {
    applyFilter,
    setActiveFilter
  };

  // NEW: инициализируем блюр заднего фона при загрузке
  recomputeAndRender(true);
  enterOverviewMode();
  updateBackgroundBlur(); // применяем начальный блюр
})();

// --- NEW: point-in-polygon hit-test for full-blob hover area ---
function pointInPolygon(x, y, pts){
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// =============================================================================
// STAGE 5: СИСТЕМА МОНИТОРИНГА И АДАПТИВНОЙ ОПТИМИЗАЦИИ
// =============================================================================

class PerformanceMonitor {
  constructor() {
    this.frameRate = 60;
    this.frameTimes = [];
    this.performanceLevel = 'high'; // high, medium, low, critical
    this.metrics = {
      avgFrameTime: 0,
      fps: 60,
      memoryUsage: 0,
      blobCount: 0,
      renderTime: 0
    };
    
    this.thresholds = {
      excellent: 55, // Было 60
      good: 35,      // Было 45
      poor: 20,      // Было 30
      critical: 10   // Было 15
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
    this.startFPSMonitoring();
    
    if (performance.memory) {
      setInterval(() => this.checkMemoryUsage(), 5000);
    }
    
    this.setupSlowFrameDetection();
    this.startAdaptiveOptimization();
  }
  
  startFPSMonitoring() {
    let lastTime = performance.now();
    
    const measureFrame = (currentTime) => {
      const frameTime = currentTime - lastTime;
      lastTime = currentTime;
      
      this.frameTimes.push(frameTime);
      
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
      }
      
      if (this.frameTimes.length % 30 === 0) {
        this.updateMetrics();
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }
  
  updateMetrics() {
    if (this.frameTimes.length === 0) return;
    
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.metrics.avgFrameTime = avgFrameTime;
    this.metrics.fps = Math.round(1000 / avgFrameTime);
    
    this.determinePerformanceLevel();
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
    
    // Обновляем CSS класс на body для визуальной индикации
    document.body.className = document.body.className.replace(/performance-\w+/g, '');
    if (this.performanceLevel !== 'high') {
      document.body.classList.add(`performance-${this.performanceLevel}`);
    }
    
    if (window.RECOMPUTE_INTERVAL !== settings.recomputeInterval) {
      window.RECOMPUTE_INTERVAL = settings.recomputeInterval;
      console.log(`🎛️ Performance mode: ${this.performanceLevel}, interval: ${settings.recomputeInterval}ms`);
    }
    
    if (window.blobs && window.blobs.length > settings.maxBlobs) {
      window.blobs = window.blobs.slice(0, settings.maxBlobs);
    }
    
    window.morphingEnabled = settings.morphingEnabled;
    this.toggleCSSFeatures(settings);
  }
  
  toggleCSSFeatures(settings) {
    const blobElements = document.querySelectorAll('.blob');
    
    blobElements.forEach(blob => {
      if (!settings.filtersEnabled) {
        blob.style.filter = 'none';
      }
      
      if (!settings.shadowsEnabled) {
        blob.style.boxShadow = 'none';
      }
      
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
      
      if (frameTime > 50) { // Более мягкая детекция: меньше 20 FPS критично
        this.handleSlowFrame(frameTime);
      }
      
      requestAnimationFrame(detectSlowFrame);
    };
    
    requestAnimationFrame(detectSlowFrame);
  }
  
  handleSlowFrame(frameTime) {
    console.warn(`🐌 Slow frame detected: ${frameTime.toFixed(2)}ms`);
    
    // Только очень медленные кадры (>150ms) активируют emergency режим
    if (frameTime > 150) {
      this.emergencyOptimization();
    }
  }
  
  emergencyOptimization() {
    console.log('🚨 Emergency optimization activated');
    
    document.body.classList.add('emergency-optimization');
    
    setTimeout(() => {
      document.body.classList.remove('emergency-optimization');
    }, 1000);
  }
  
  checkMemoryUsage() {
    if (performance.memory) {
      const memory = performance.memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (this.metrics.memoryUsage > 0.8) {
        console.warn('🧠 High memory usage detected:', Math.round(this.metrics.memoryUsage * 100) + '%');
        this.forceGarbageCollection();
      }
    }
  }
  
  forceGarbageCollection() {
    if (window.pathInterpolationCache && window.pathInterpolationCache.size > 100) {
      window.pathInterpolationCache.clear();
      console.log('🗑️ Path interpolation cache cleared');
    }
    
    if (voronoiCache && voronoiCache.cache.size > 50) {
      voronoiCache.clear();
      console.log('🗑️ Voronoi cache cleared');
    }
    
    if (spatialGrid) {
      spatialGrid.clear();
    }
  }
  
  startAdaptiveOptimization() {
    setInterval(() => {
      this.adaptToDeviceCapabilities();
    }, 2000);
  }
  
  adaptToDeviceCapabilities() {
    if (window.innerWidth <= 768) {
      this.optimizeForMobile();
    }
    
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          this.activatePowerSaveMode();
        }
      });
    }
    
    if (navigator.connection && navigator.connection.effectiveType) {
      const connection = navigator.connection.effectiveType;
      if (connection === 'slow-2g' || connection === '2g') {
        this.activateSlowConnectionMode();
      }
    }
  }
  
  optimizeForMobile() {
    if (window.blobs && window.blobs.length > 6) {
      window.blobs = window.blobs.slice(0, 6);
    }
    
    document.body.classList.add('mobile-optimized');
  }
  
  activatePowerSaveMode() {
    console.log('🔋 Power save mode activated');
    this.performanceLevel = 'low';
    this.applyAdaptiveSettings();
  }
  
  activateSlowConnectionMode() {
    console.log('🐌 Slow connection detected');
    window.RECOMPUTE_INTERVAL = 100;
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

// ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ МОНИТОРИНГА
window.performanceMonitor = new PerformanceMonitor();

// ИНТЕГРАЦИЯ С ОСНОВНЫМ ЦИКЛОМ
const _originalRecomputeAndRender = window.recomputeAndRender;
if (_originalRecomputeAndRender) {
  window.recomputeAndRender = function() {
    if (window.performanceMonitor.shouldSkipFrame()) {
      return;
    }
    
    const startTime = performance.now();
    _originalRecomputeAndRender.call(this);
    const renderTime = performance.now() - startTime;
    
    window.performanceMonitor.metrics.renderTime = renderTime;
    
    if (renderTime > 20) {
      window.RECOMPUTE_INTERVAL = Math.min(window.RECOMPUTE_INTERVAL + 5, 100);
    }
  };
}

// ПУБЛИЧНЫЙ API ДЛЯ ДИАГНОСТИКИ
window.getPerformanceReport = () => window.performanceMonitor.getPerformanceReport();

console.log('🎯 Performance monitoring system activated');
console.log('📊 Use getPerformanceReport() to see current metrics');
