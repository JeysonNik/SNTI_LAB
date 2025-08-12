(() => {
  // Config: choose type per project (by category/id/title). Fallback: 1
  const OVERLAY_TYPES = [
    { when: { category: 'alpha' }, type: 1 },
    { when: { category: 'beta'  }, type: 2 },
    { when: { category: 'gamma' }, type: 3 }
  ];

  function matchProject(v, cond) {
    if (!cond) return false;
    if (cond.id && v.id !== cond.id) return false;
    if (cond.category && v.category !== cond.category) return false;
    if (cond.title && !(v.title||'').includes(cond.title)) return false;
    return true;
  }

  function pickOverlayType(v){
    // First check overlay.layoutType, then fallback to category rules
    if (v?.overlay?.layoutType) return v.overlay.layoutType;
    if (v && (v.layoutType === 1 || v.layoutType === 2 || v.layoutType === 3)) return v.layoutType;
    for (const rule of OVERLAY_TYPES) if (matchProject(v, rule.when)) return rule.type;
    return 1;
  }

  // Util
  function el(tag, cls, html){ const n = document.createElement(tag); if(cls) n.className = cls; if(html!=null) n.innerHTML = html; return n; }
  function textFromHTML(str){ const s = (str||'').replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim(); return s || ''; }
  function isMobile(){ return window.matchMedia && window.matchMedia('(max-width: 980px)').matches; }

  // Cleanups (intervals, listeners) for current overlay
  let overlayCleanups = [];
  function pushCleanup(fn){ overlayCleanups.push(fn); }
  function runCleanups(){ for(const fn of overlayCleanups){ try{ fn(); }catch(_){ } } overlayCleanups = []; }

  // Slider with autoplay and dots overlay - UPDATED: title parameter controls overlay title
  function buildSlider(title, imgs){
    const wrap = el('div','ov-slider');
    const main = el('div','ov-main');
    const mainImg = el('img','ov-main-img');
    main.appendChild(mainImg);

    // Title overlays the image only if title is provided (type 3 only)
    if (title) main.appendChild(el('div','ov-title overlay', title));

    const list = (Array.isArray(imgs) ? imgs : []).slice();
    if (!list.length) list.push('https://picsum.photos/seed/placeholder/1200/800');

    const dots = el('div','ov-dots');
    let active = 0;
    let userInteracted = false;
    
    function setActive(i){
      active = i;
      
      // Add smooth transition for mobile
      if (window.matchMedia && window.matchMedia('(max-width: 980px)').matches) {
        mainImg.style.transition = 'opacity 0.3s ease';
        mainImg.style.opacity = '0';
        
        setTimeout(() => {
          mainImg.src = list[active];
          mainImg.style.opacity = '1';
        }, 150);
      } else {
        mainImg.src = list[active];
      }
      
      [...dots.children].forEach((d,idx)=>d.classList.toggle('active', idx===active));
    }

    // NEW: функция для переключения изображений с помощью колесика
    function handleWheel(e) {
      e.preventDefault(); // предотвращаем скроллинг страницы
      userInteracted = true;
      
      if (e.deltaY > 0) {
        // прокрутка вниз - следующее изображение
        setActive((active + 1) % list.length);
      } else {
        // прокрутка вверх - предыдущее изображение
        setActive((active - 1 + list.length) % list.length);
      }
    }

    // NEW: добавляем обработчик колесика к main элементу
    main.addEventListener('wheel', handleWheel, { passive: false });
    
    // NEW: Touch/swipe support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50; // минимальная дистанция для регистрации свайпа
    const maxVerticalMovement = 100; // максимальное вертикальное движение для горизонтального свайпа

    function handleTouchStart(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }

    function handleTouchMove(e) {
      // Предотвращаем скролл только если это горизонтальный свайп
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - touchStartX);
      const deltaY = Math.abs(currentY - touchStartY);
      
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault(); // предотвращаем скролл страницы при горизонтальном свайпе
      }
    }

    function handleTouchEnd(e) {
      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;
      handleSwipe();
    }

    function handleSwipe() {
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);
      
      // Проверяем, что это горизонтальный свайп
      if (Math.abs(deltaX) > minSwipeDistance && deltaY < maxVerticalMovement) {
        userInteracted = true;
        
        // Добавляем визуальную обратную связь
        main.style.transform = 'scale(0.98)';
        setTimeout(() => {
          main.style.transform = 'scale(1)';
        }, 100);
        
        if (deltaX > 0) {
          // Свайп вправо - предыдущее изображение
          setActive((active - 1 + list.length) % list.length);
        } else {
          // Свайп влево - следующее изображение
          setActive((active + 1) % list.length);
        }
        
        // Скрываем подсказку после первого свайпа
        main.classList.remove('show-swipe-hint');
        
        // Добавляем тактильную обратную связь, если доступна
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }

    // Добавляем touch обработчики
    main.addEventListener('touchstart', handleTouchStart, { passive: true });
    main.addEventListener('touchmove', handleTouchMove, { passive: false });
    main.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // NEW: cleanup функция для удаления обработчиков
    pushCleanup(() => {
      main.removeEventListener('wheel', handleWheel);
      main.removeEventListener('touchstart', handleTouchStart);
      main.removeEventListener('touchmove', handleTouchMove);
      main.removeEventListener('touchend', handleTouchEnd);
    });

    list.forEach((src,i)=>{
      const b = el('button','ov-dot'); b.type='button'; if(i===0) b.classList.add('active');
      b.onclick = ()=>{ userInteracted = true; setActive(i); };
      dots.appendChild(b);
    });
    main.appendChild(dots);

    const interval = setInterval(()=>{ if(userInteracted) return; setActive((active+1)%list.length); }, 3500);
    pushCleanup(()=> clearInterval(interval));
    setActive(0);

    // Show swipe hint on mobile for a few seconds
    if (window.matchMedia && window.matchMedia('(max-width: 980px)').matches) {
      main.classList.add('show-swipe-hint');
      setTimeout(() => {
        main.classList.remove('show-swipe-hint');
      }, 3000); // Hide hint after 3 seconds
    }

    wrap.appendChild(main);
    return wrap;
  }

  // Reusable pieces for right/left content
  function buildList(lines){
    const list = el('div','ov-list');
    lines.forEach(li => {
      const it = el('div','ov-item');
      const img = document.createElement('img'); img.className = 'ov-thumbimg'; img.src = li.img || 'https://picsum.photos/seed/line/160';
      const txt = el('div','ov-line-text', li.text || '');
      it.appendChild(img); it.appendChild(txt);
      list.appendChild(it);
    });
    return list;
  }
  function buildBlock(img, text, reverse=false){
    const blk = el('div','ov-block' + (reverse?' reverse':'')),
          im = document.createElement('img'),
          tx = el('div','ov-block-text', text || '');
    im.className = 'ov-img'; im.src = img || 'https://picsum.photos/seed/block/300';
    blk.appendChild(im); blk.appendChild(tx);
    return blk;
  }
  function buildFigure(img, caption){
    const f = el('figure','ov-figure'),
          im = document.createElement('img'),
          cap = el('figcaption',null, caption || '');
    im.src = img || 'https://picsum.photos/seed/bottom/800/400';
    f.appendChild(im); f.appendChild(cap);
    return f;
  }

  // Export builder functions to global scope for use in separate overlay files
  window.buildSlider = buildSlider;
  window.buildList = buildList;
  window.buildBlock = buildBlock;
  window.buildFigure = buildFigure;

  // UPDATED: use v.overlay data directly from content.js with more text content
  function deriveContent(v){
    const overlay = v?.overlay;
    if (!overlay) {
      // Fallback if no overlay data
      const imgs = Array.isArray(v?.imgs) ? v.imgs : ['https://picsum.photos/seed/placeholder/1200/800'];
      const descHTML = v?.text || `<p>${(v?.title||'')}: description will be here.</p>`;
      const plain = descHTML.replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim();
      
      return {
        imgs,
        descHTML: `<p>${plain.slice(0, 180)}...</p>`, // Increased from 120
        lines: [
          { img: imgs[0], text: plain.slice(0, 65) || 'Short description A' },
          { img: imgs[1] || imgs[0], text: plain.slice(65, 130) || 'Short description B' },
          { img: imgs[2] || imgs[0], text: plain.slice(130, 195) || 'Short description C' }
        ],
        middleBlock: { img: imgs[1] || imgs[0], text: plain.slice(0, 140) || 'Additional details' }, // Increased from 100
        bottomFigure: { img: imgs[2] || imgs[0], caption: v?.caption || 'Caption for the image' },
        pairBlocks: [
          { img: imgs[1] || imgs[0], text: plain.slice(0, 100) }, // Increased from 80
          { img: imgs[2] || imgs[0], text: plain.slice(100, 200), reverse: true } // Increased ranges
        ]
      };
    }

    // Use overlay data directly from content.js OVERLAY_CONTENT with more content
    const imgs = overlay.images || ['https://picsum.photos/seed/placeholder/1200/800'];
    const fullDesc = overlay.paragraphs ? overlay.paragraphs.map(p => `<p>${p}</p>`).join('') : (v?.text || '');
    
    // Use more of the available paragraphs content for type 3
    let expandedDesc = fullDesc;
    if (overlay.paragraphs && overlay.paragraphs.length > 2) {
      // For type 3: use ALL available paragraphs to fill the space
      const useParas = overlay.paragraphs.slice(0, overlay.paragraphs.length);
      expandedDesc = useParas.map(p => `<p>${p}</p>`).join('');
    }
    
    return {
      imgs,
      descHTML: expandedDesc, // Remove length limit for type 3 to use more space
      lines: overlay.list?.slice(0, 3).map(item => ({
        ...item,
        text: item.text ? item.text.slice(0, 75) + (item.text.length > 75 ? '...' : '') : item.text
      })) || [],
      middleBlock: overlay.blocks?.[0] ? {
        ...overlay.blocks[0],
        text: overlay.blocks[0].text ? overlay.blocks[0].text.slice(0, 150) + (overlay.blocks[0].text.length > 150 ? '...' : '') : overlay.blocks[0].text
      } : { img: imgs[1] || imgs[0], text: 'Additional details' },
      bottomFigure: overlay.figure || { img: imgs[2] || imgs[0], caption: 'Caption for the image' },
      pairBlocks: overlay.blocks?.slice(0, 2).map((block, idx) => ({
        ...block,
        text: block.text ? block.text.slice(0, 120) + (block.text.length > 120 ? '...' : '') : block.text,
        reverse: idx === 1
      })) || []
    };
  }

  // Global renderer (used by script.js)
  window.showDetail = function showDetail(v, idx){
    const overlay = document.getElementById('detailOverlay');
    const oc = document.querySelector('#detailOverlay .overlay-content');
    const closeBtn = document.getElementById('closeOverlay');
    if(!overlay || !oc || !closeBtn) return;

    // Cleanup previous
    runCleanups();
    // Remove old dynamic content, keep close button
    while (closeBtn.nextSibling) closeBtn.parentNode.removeChild(closeBtn.nextSibling);

    const type = pickOverlayType(v);
    const data = deriveContent(v);
    const title = v?.overlay?.title || v?.title || 'Project';

    // Check if mobile layout should be used
    if (isMobile()) {
      // Mobile layout: single column, vertical order
      console.log('Using mobile layout for overlay');
      
      // Use mobile layout function if available
      if (window.buildMobileLayout) {
        const mobileContainer = window.buildMobileLayout(title, data, type);
        closeBtn.insertAdjacentElement('afterend', mobileContainer);
      } else {
        console.warn('Mobile layout function not loaded');
      }
      
      // Mobile positioning handled by CSS with !important
      closeBtn.style.top = '';
      closeBtn.style.right = '';
    } else {
      // Desktop layout: two-column grid
      console.log('Using desktop layout for overlay, type:', type);
      
      // Use desktop layout function if available
      if (window.buildDesktopLayout) {
        window.buildDesktopLayout(title, data, type, closeBtn);
      } else {
        console.warn('Desktop layout function not loaded');
      }
    }

    closeBtn.style.zIndex = '2000';
    closeBtn.onclick = () => {
      runCleanups();
      overlay.classList.remove('visible');
      document.body.classList.remove('blurred');
      // Reset close button position
      closeBtn.style.top = '';
      closeBtn.style.right = '';
    };

    overlay.classList.add('visible');
    document.body.classList.add('blurred');
  };
})();

