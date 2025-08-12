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
  filterSpans.forEach(span => {
    span.addEventListener('click', () => {
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
    });
    // keyboard support
    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        span.click();
      }
    });
  });

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

