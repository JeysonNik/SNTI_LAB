(() => {
  // helpers
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; }

  // --- NEW: per-button descriptions with typewriter effect ---
  const DESCRIPTIONS = {
    alpha: 'Study data and scenarios to uncover actionable insights',
    beta: 'Optimize calculations, and component rules to improve performance and reduce costs',
    gamma:'Generate concept-driven forms and producible parametric components with clear details'
  };

  const bar = document.getElementById('filterBar');
  const filters = bar ? bar.querySelector('.filters') : null;
  const searchEl = document.getElementById('searchInput');

  let typingTimer = null;
  let isOpen = false;
  let current = { key: null, span: null, desc: null, inner: null };

  // --- NEW: marquee timers/controls ---
  let marqueeTimer = null;
  let marqueeRAF = null;
  function clearMarquee(){
    if(marqueeTimer){ clearTimeout(marqueeTimer); marqueeTimer = null; }
    if(marqueeRAF){ cancelAnimationFrame(marqueeRAF); marqueeRAF = null; }
    if(current.inner){
      current.inner.style.transform = 'translateX(0px)';
      current.inner.style.willChange = '';
    }
  }
  // -------------------------------------

  function stopTyping(){ if(typingTimer){ clearTimeout(typingTimer); typingTimer = null; } }

  function sumMargins(el){
    const cs = getComputedStyle(el);
    return (parseFloat(cs.marginLeft)||0) + (parseFloat(cs.marginRight)||0);
  }
  function getFlexGap(){
    if(!filters) return 0;
    const cs = getComputedStyle(filters);
    const gapStr = (cs.columnGap && cs.columnGap !== 'normal') ? cs.columnGap : (cs.gap || '0px');
    const v = parseFloat(gapStr);
    return Number.isFinite(v) ? v : 0;
  }

  // FIX: ширина учитывает только реальные элементы (без всех .btn-desc), gap считается по их количеству
  function calcMaxDescWidth(descElRef){
    if(!bar || !filters) return 0;

    const barW = bar.clientWidth;
    const rightW = searchEl ? (searchEl.offsetWidth + sumMargins(searchEl)) : 0;
    const safe = 12;
    const available = Math.max(0, barW - rightW - safe);

    const children = Array.from(filters.children);
    const items = children.filter(ch => {
      // исключаем все описания, в т.ч. сворачивающиеся, и сам измеряемый desc
      return ch !== descElRef && !(ch.classList && ch.classList.contains('btn-desc'));
    });

    const gap = getFlexGap();
    const gapsTotal = gap * Math.max(0, items.length - 1);

    let used = 0;
    for(const ch of items){ used += ch.offsetWidth; }

    const max = Math.max(0, available - used - gapsTotal);
    return Math.floor(max);
  }

  // CHANGE: печатаем внутрь вложенного span (inner), не обрывая при переполнении
  function typeWriter(descElRef, innerElRef, fullText, onDone){
    stopTyping();
    innerElRef.textContent = '';
    let idx = 0;
    const step = () => {
      if(idx >= fullText.length){ typingTimer = null; onDone && onDone(); return; }
      innerElRef.textContent += fullText.charAt(idx++);
      typingTimer = setTimeout(step, 18);
    };
    step();
  }

  // NEW: запуск слайдинга при переполнении через 3 сек, один раз
  function maybeStartMarquee(descElRef, innerElRef){
    clearMarquee();
    const overflow = innerElRef.scrollWidth - descElRef.clientWidth;
    if(overflow > 4){
      marqueeTimer = setTimeout(()=>{
        const dist = overflow; // px
        // длительность пропорциональна расстоянию, но в разумных пределах
        const dur = Math.min(12000, Math.max(4000, dist * 18));
        const start = performance.now();
        innerElRef.style.willChange = 'transform';
        const tick = (t)=>{
          const p = Math.min(1, (t - start) / dur);
          const x = -dist * p;
          innerElRef.style.transform = `translateX(${x}px)`;
          if(p < 1) marqueeRAF = requestAnimationFrame(tick);
          else { marqueeRAF = null; }
        };
        marqueeRAF = requestAnimationFrame(tick);
      }, 3000);
    }
  }

  // CHANGE: force=true — мгновенно убираем старый desc, чтобы не портил расчет/гепы
  function closeCurrentDesc(force=false){
    stopTyping();
    clearMarquee();
    if(current.desc){
      current.desc.classList.remove('open');
      if(force){
        if(current.desc.parentNode) current.desc.parentNode.removeChild(current.desc);
      }else{
        current.desc.style.maxWidth = '0px';
        const el = current.desc;
        setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 260);
      }
    }
    isOpen = false;
    current = { key: null, span: null, desc: null, inner: null };
  }

  function openDescFor(spanEl, key){
    if(!filters || !DESCRIPTIONS[key]) return;
    if(isOpen && current.span && current.span !== spanEl) closeCurrentDesc(true);
    if(isOpen && current.span === spanEl){ closeCurrentDesc(); return; }

    // создаем контейнер + вложенный inner для слайдинга
    const desc = document.createElement('span');
    desc.className = 'btn-desc';
    desc.style.fontFamily = "'Inter', sans-serif"; // Применяем шрифт Inter
    const inner = document.createElement('span');
    inner.className = 'btn-desc-inner';
    inner.style.fontFamily = "'Inter', sans-serif"; // Применяем шрифт Inter
    desc.appendChild(inner);
    spanEl.insertAdjacentElement('afterend', desc);

    const maxW = calcMaxDescWidth(desc);
    desc.style.maxWidth = maxW + 'px';
    desc.classList.add('open');

    // запускаем печать; после завершения — проверяем переполнение и, если надо, запускаем слайдинг
    typeWriter(desc, inner, DESCRIPTIONS[key], () => maybeStartMarquee(desc, inner));

    isOpen = true;
    current = { key, span: spanEl, desc, inner };
  }

  // Recompute on resize, trimming if needed
  window.addEventListener('resize', debounce(()=>{
    if(!isOpen || !current.desc) return;
    // пересчет ширины и сброс/перезапуск слайдинга
    const maxW = calcMaxDescWidth(current.desc);
    current.desc.style.maxWidth = maxW + 'px';
    clearMarquee();
    // если текст уже напечатан (inner создан), при необходимости перезапускаем слайд
    if(current.inner && current.inner.textContent){
      // чуть подождем завершения транзишна ширины, чтобы размеры стабилизировались
      setTimeout(()=> maybeStartMarquee(current.desc, current.inner), 200);
    }
  }, 120));
  // --- END NEW ---

  // filter UI wiring
  const filterSpans = document.querySelectorAll('#filterBar .filters span');
  filterSpans.forEach(span => span.addEventListener('click', () => {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';

    // фильтрация (blobs app)
    if (window.BlobsApp) {
      window.BlobsApp.applyFilter(span.dataset.filter);
      window.BlobsApp.setActiveFilter(span.dataset.filter);
    }

    // описания: показываем только для alpha/beta/gamma; для "all" — закрываем
    const key = (span.dataset.filter || '').toLowerCase();
    if (key === 'all'){ closeCurrentDesc(true); return; }
    if (DESCRIPTIONS[key]) openDescFor(span, key);
  }));

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e)=>{
      const v = (e.target.value || '').trim();
      if (window.BlobsApp) window.BlobsApp.applyFilter(v === '' ? 'all' : v);
      closeCurrentDesc(true); // ввод в поиске — сразу скрываем описание, чтобы не мешало
    }, 180));
  }

  // overlay logic
  const overlay = document.getElementById('detailOverlay');
  const closeBtn = document.getElementById('closeOverlay');
  if (closeBtn) closeBtn.onclick = () => {
    overlay.classList.remove('visible');
    document.body.classList.remove('blurred');
  };

  // NOTE: Overlay rendering (showDetail, variants, slider) moved to overlay.js
})();
  const OVERLAY_TYPES = [
    { when: { category: 'alpha' }, type: 1 },
    { when: { category: 'beta'  }, type: 2 },
    { when: { category: 'gamma' }, type: 3 }
    // Examples:
    // { when: { id: 'alpha3' }, type: 2 },
    // { when: { title: 'Project Beta 2' }, type: 3 }
  ];

  function matchProject(v, cond) {
    if (!cond) return false;
    if (cond.id && v.id !== cond.id) return false;
    if (cond.category && v.category !== cond.category) return false;
    if (cond.title && !(v.title||'').includes(cond.title)) return false;
    return true;
  }
  function pickOverlayType(v){
    if (v && (v.layoutType === 1 || v.layoutType === 2 || v.layoutType === 3)) return v.layoutType;
    for (const rule of OVERLAY_TYPES) if (matchProject(v, rule.when)) return rule.type;
    return 1;
  }

  // Helpers to build pieces
  function el(tag, cls, html){ const n = document.createElement(tag); if(cls) n.className = cls; if(html!=null) n.innerHTML = html; return n; }
  function textFromHTML(str){
    const s = (str||'').replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim();
    return s || '';
  }
  function buildSlider(title, imgs){
    const wrap = el('div','ov-slider');
    if (title) wrap.appendChild(el('div','ov-title', title));
    const main = el('div','ov-main'); const mainImg = el('img'); main.appendChild(mainImg);
    const thumbs = el('div','ov-thumbs');
    wrap.appendChild(main); wrap.appendChild(thumbs);
    const list = (imgs && imgs.length ? imgs : []).slice();
    if (!list.length) list.push('https://picsum.photos/seed/placeholder/800/600');
    let active = 0;
    function setActive(i){
      active = i;
      mainImg.src = list[active];
      [...thumbs.children].forEach((t,idx)=>t.classList.toggle('active', idx===active));
    }
    list.forEach((src,i)=>{
      const t = el('button','ov-thumb'); t.type='button';
      const im = el('img'); im.src = src; t.appendChild(im);
      t.onclick = ()=> setActive(i);
      thumbs.appendChild(t);
    });
    setActive(0);
    return wrap;
  }

  function buildList(lines){
    const list = el('div','ov-list');
    lines.forEach(li => {
      const it = el('div','ov-item');
      const img = el('img','ov-thumbimg'); img.src = li.img || 'https://picsum.photos/seed/line/160';
      const txt = el('div','ov-line-text', li.text || '');
      it.appendChild(img); it.appendChild(txt);
      list.appendChild(it);
    });
    return list;
  }
  function buildBlock(img, text, reverse=false){
    const blk = el('div','ov-block' + (reverse?' reverse':''));
    const im = el('img','ov-img'); im.src = img || 'https://picsum.photos/seed/block/300';
    const tx = el('div','ov-block-text', text || '');
    blk.appendChild(im); blk.appendChild(tx);
    return blk;
  }
  function buildFigure(img, caption){
    const f = el('figure','ov-figure');
    const im = el('img'); im.src = img || 'https://picsum.photos/seed/bottom/800/400';
    const cap = el('figcaption',null, caption || '');
    f.appendChild(im); f.appendChild(cap);
    return f;
  }

  // Normalize per-project content (unique per project using v)
  function deriveContent(v){
    const imgs = Array.isArray(v.imgs) && v.imgs.length ? v.imgs : ['https://picsum.photos/seed/placeholder/800/600'];
    const descHTML = v.text || `<p>${(v.title||'')}: description will be here.</p>`;
    const plain = textFromHTML(descHTML);

    // 3 short lines (for type 1)
    const lines = [
      { img: imgs[0], text: plain.slice(0, 80) || 'Short description A' },
      { img: imgs[1] || imgs[0], text: plain.slice(80, 170) || 'Short description B' },
      { img: imgs[2] || imgs[0], text: plain.slice(170, 260) || 'Short description C' }
    ];

    // One middle block + bottom figure (type 2)
    const middleBlock = { img: imgs[1] || imgs[0], text: plain.slice(0, 160) || 'Additional details' };
    const bottomFigure = { img: imgs[2] || imgs[0], caption: (v.caption || 'Caption for the image') };

    // Two blocks for type 3 (one reversed)
    const pairBlocks = [
      { img: imgs[1] || imgs[0], text: plain.slice(0, 120), reverse: false },
      { img: imgs[2] || imgs[0], text: plain.slice(120, 260), reverse: true }
    ];

    return { imgs, descHTML, lines, middleBlock, bottomFigure, pairBlocks };
  }

  // Replace old overlay renderer
  // global showDetail used by script.js click handlers
  window.showDetail = function showDetail(v, idx){
    const overlay = document.getElementById('detailOverlay');
    const oc = document.querySelector('#detailOverlay .overlay-content');
    const closeBtn = document.getElementById('closeOverlay');

    // Clear previous dynamic content but keep close button
    while (closeBtn.nextSibling) closeBtn.parentNode.removeChild(closeBtn.nextSibling);

    const type = pickOverlayType(v);
    const data = deriveContent(v);

    // Build two columns grid
    const grid = el('div', `ov-grid type-${type}`);
    const left = el('div','ov-col'); const right = el('div','ov-col');

    if (type === 1) {
      // Left: slider + title (title over slider)
      left.appendChild(buildSlider(v.title || 'Project', data.imgs));
      left.classList.add('slider-col'); // no scroll in slider column

      // Right: text + 3 short lines with thumbs
      const topText = el('div','ov-text'); topText.innerHTML = data.descHTML;
      right.appendChild(topText);
      right.appendChild(buildList(data.lines));
    } else if (type === 2) {
      // Left: slider + title (title over slider)
      left.appendChild(buildSlider(v.title || 'Project', data.imgs));
      left.classList.add('slider-col'); // no scroll in slider column

      // Right: text + one block + large figure with caption
      const topText = el('div','ov-text'); topText.innerHTML = data.descHTML;
      right.appendChild(topText);
      right.appendChild(buildBlock(data.middleBlock.img, data.middleBlock.text, false));
      right.appendChild(buildFigure(data.bottomFigure.img, data.bottomFigure.caption));
    } else {
      // Type 3: slider on right (no title duplication on right)
      const title = el('div','ov-title', v.title || 'Project');
      const smallText = el('div','ov-text small'); smallText.innerHTML = data.descHTML;
      left.appendChild(title);
      left.appendChild(smallText);
      data.pairBlocks.forEach(b => left.appendChild(buildBlock(b.img, b.text, !!b.reverse)));

      right.appendChild(buildSlider(null, data.imgs));
      right.classList.add('slider-col'); // no scroll in slider column
    }

    grid.appendChild(left); grid.appendChild(right);
    closeBtn.insertAdjacentElement('afterend', grid);

    overlay.classList.add('visible');
    document.body.classList.add('blurred');
  };


