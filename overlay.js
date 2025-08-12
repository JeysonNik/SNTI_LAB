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
      mainImg.src = list[active];
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
    
    // NEW: cleanup функция для удаления обработчика
    pushCleanup(() => {
      main.removeEventListener('wheel', handleWheel);
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

    // Two-column grid
    const grid = el('div', `ov-grid type-${type}`);
    const left = el('div','ov-col');
    const right = el('div','ov-col');

    if (type === 1) {
      // Left: slider without title (no overlay title)
      left.appendChild(buildSlider(null, data.imgs));
      left.classList.add('slider-col');
      right.classList.add('content-col');

      // Right: title + text + 3 short lines
      const titleEl = el('div','ov-title right', title);
      const topText = el('div','ov-text'); topText.innerHTML = data.descHTML;
      right.appendChild(titleEl);
      right.appendChild(topText);
      right.appendChild(buildList(data.lines));
    } else if (type === 2) {
      // Left: slider without title (no overlay title)
      left.appendChild(buildSlider(null, data.imgs));
      left.classList.add('slider-col');
      right.classList.add('content-col');

      // Right: title + text + one block + large figure
      const titleEl = el('div','ov-title right', title);
      const topText = el('div','ov-text'); topText.innerHTML = data.descHTML;
      right.appendChild(titleEl);
      right.appendChild(topText);
      right.appendChild(buildBlock(data.middleBlock.img, data.middleBlock.text, false));
      right.appendChild(buildFigure(data.bottomFigure.img, data.bottomFigure.caption));
    } else {
      // Type 3: bigger title on the left, aligned bottom-left
      const titleEl = el('div','ov-title left', title);
      const smallText = el('div','ov-text small'); smallText.innerHTML = data.descHTML;

      left.appendChild(smallText);
      // Ensure blocks have explicit reverse property set correctly
      data.pairBlocks.forEach((b, index) => {
        const block = buildBlock(b.img, b.text, b.reverse);
        left.appendChild(block);
      });
      left.appendChild(titleEl); // put title at the end so it sits at bottom with CSS
      left.classList.add('content-col');

      right.appendChild(buildSlider(null, data.imgs)); // no title on slider
      right.classList.add('slider-col');
    }

    grid.appendChild(left); grid.appendChild(right);
    closeBtn.insertAdjacentElement('afterend', grid);

    // Adjust close button position for type 3
    if (type === 3) {
      closeBtn.style.top = '40px';
      closeBtn.style.right = '50px';
    } else {
      closeBtn.style.top = '20px';
      closeBtn.style.right = '30px';
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

