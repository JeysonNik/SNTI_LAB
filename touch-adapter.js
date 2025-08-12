// Touch-to-Pointer adapter: enables quick tap (open) and drag on phones
// without modifying existing pointer-based logic.
(function(){
  // If the environment already supports pointer events, do nothing.
  if ('onpointerdown' in window) return;

  function createPointerEvent(type, x, y){
    try {
      // Try native PointerEvent if available in some browsers
      if (typeof PointerEvent !== 'undefined') {
        return new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
      }
    } catch(_) {}
    // Fallback: generic Event with injected clientX/clientY
    const ev = new Event(type, { bubbles: true, cancelable: true });
    try {
      Object.defineProperty(ev, 'clientX', { value: x, enumerable: true });
      Object.defineProperty(ev, 'clientY', { value: y, enumerable: true });
    } catch(_) {}
    return ev;
  }

  function setup(el){
    if (!el) return;
    let activeId = null;
    let lastX = 0, lastY = 0;

    el.addEventListener('touchstart', (e) => {
      if (activeId !== null) return; // ignore multi-touch
      const t = e.changedTouches[0];
      activeId = t.identifier;
      lastX = t.clientX; lastY = t.clientY;
      const pd = createPointerEvent('pointerdown', lastX, lastY);
      el.dispatchEvent(pd);
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (activeId === null) return;
      // Find the active touch by id
      let t = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeId) { t = e.changedTouches[i]; break; }
      }
      if (!t) return;
      lastX = t.clientX; lastY = t.clientY;
      const pm = createPointerEvent('pointermove', lastX, lastY);
      el.dispatchEvent(pm);
      // Prevent page scroll while dragging
      try { e.preventDefault(); } catch(_) {}
    }, { passive: false });

    function endLike(type, e){
      if (activeId === null) return;
      let t = null;
      if (e && e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeId) { t = e.changedTouches[i]; break; }
        }
      }
      const x = t ? t.clientX : lastX;
      const y = t ? t.clientY : lastY;
      const pu = createPointerEvent(type, x, y);
      el.dispatchEvent(pu);
      activeId = null;
    }

    el.addEventListener('touchend', (e) => endLike('pointerup', e), { passive: true });
    el.addEventListener('touchcancel', (e) => endLike('pointerup', e), { passive: true });
  }

  // Defer until DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setup(document.getElementById('svgRoot')));
  } else {
    setup(document.getElementById('svgRoot'));
  }
})();
