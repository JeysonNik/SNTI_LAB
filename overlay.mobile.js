// Mobile-specific overlay logic
(() => {
  // Helper functions (needed for mobile layout)
  function el(tag, cls, html){ const n = document.createElement(tag); if(cls) n.className = cls; if(html!=null) n.innerHTML = html; return n; }
  
  // Mobile overlay layout function
  function buildMobileLayout(title, data, type) {
    const container = el('div', 'ov-mobile-container');
    
    if (type === 1) {
      // Type 1: Analysis - title, slider, text, list
      // 1. Title at the top
      const titleEl = el('div', 'ov-title mobile-title', title);
      container.appendChild(titleEl);
      
      // 2. Slider
      const slider = buildSlider(null, data.imgs);
      container.appendChild(slider);
      
      // 3. Text description
      const textEl = el('div', 'ov-text mobile-text');
      textEl.innerHTML = data.descHTML;
      container.appendChild(textEl);
      
      // 4. List (3 short lines)
      if (data.lines && data.lines.length > 0) {
        const list = buildList(data.lines);
        container.appendChild(list);
      }
      
    } else if (type === 2) {
      // Type 2: Optimization - title, slider, text, block, figure
      // 1. Title at the top
      const titleEl = el('div', 'ov-title mobile-title', title);
      container.appendChild(titleEl);
      
      // 2. Slider
      const slider = buildSlider(null, data.imgs);
      container.appendChild(slider);
      
      // 3. Text description
      const textEl = el('div', 'ov-text mobile-text');
      textEl.innerHTML = data.descHTML;
      container.appendChild(textEl);
      
      // 4. One block
      if (data.middleBlock) {
        const block = buildBlock(data.middleBlock.img, data.middleBlock.text, false);
        container.appendChild(block);
      }
      
      // 5. Large figure
      if (data.bottomFigure) {
        const figure = buildFigure(data.bottomFigure.img, data.bottomFigure.caption);
        container.appendChild(figure);
      }
      
    } else {
      // Type 3: Formation - title, slider, text, blocks
      // 1. Title at the top (moved from bottom for mobile)
      const titleEl = el('div', 'ov-title mobile-title', title);
      container.appendChild(titleEl);
      
      // 2. Slider
      const slider = buildSlider(null, data.imgs);
      container.appendChild(slider);
      
      // 3. Text description (small)
      const textEl = el('div', 'ov-text mobile-text small');
      textEl.innerHTML = data.descHTML;
      container.appendChild(textEl);
      
      // 4. Blocks (pair blocks with reverse handling)
      if (data.pairBlocks && data.pairBlocks.length > 0) {
        data.pairBlocks.forEach((blockData) => {
          const block = buildBlock(blockData.img, blockData.text, false); // no reverse on mobile for simplicity
          container.appendChild(block);
        });
      }
    }
    
    return container;
  }

  // Export mobile layout function to global scope
  window.buildMobileLayout = buildMobileLayout;
})();
