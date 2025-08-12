// Desktop-specific overlay logic
(() => {
  // Helper functions (needed for desktop layout)
  function el(tag, cls, html){ const n = document.createElement(tag); if(cls) n.className = cls; if(html!=null) n.innerHTML = html; return n; }
  
  // Desktop overlay layout function
  function buildDesktopLayout(title, data, type, closeBtn) {
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

    grid.appendChild(left); 
    grid.appendChild(right);
    closeBtn.insertAdjacentElement('afterend', grid);

    // Adjust close button position for type 3
    if (type === 3) {
      closeBtn.style.top = '40px';
      closeBtn.style.right = '50px';
    } else {
      closeBtn.style.top = '20px';
      closeBtn.style.right = '30px';
    }

    return grid;
  }

  // Export desktop layout function to global scope
  window.buildDesktopLayout = buildDesktopLayout;
})();
