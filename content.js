let originalContents = new WeakMap(); // Store original content for Bionic Reading

// Dyslexia support functions
function applyDyslexiaStyles(settings) {
  removeDyslexiaStyles();

  // Set CSS variables for all settings
  document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
  document.documentElement.style.setProperty('--line-height', settings.lineSpacing);
  document.documentElement.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);
  document.documentElement.style.setProperty('--word-spacing', `${settings.wordSpacing}em`);
  document.documentElement.style.setProperty('--background-color', backgroundColorMap[settings.backgroundColor] || '#ffffff');
  document.documentElement.style.setProperty('--column-width', `${settings.columnWidth}px`);

  // Inject style if not present
  if (!document.getElementById('visionaid-dyslexia-styles')) {
    const style = document.createElement('style');
    style.id = 'visionaid-dyslexia-styles';
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Lexend&family=Andika&family=Atkinson+Hyperlegible&family=Comic+Neue&display=swap');
      @import url('https://fonts.cdnfonts.com/css/open-dyslexic');
      .visionaid-text {
        font-family: '${fontMap[settings.fontFamily] || 'OpenDyslexic'}', sans-serif !important;
        font-size: var(--font-size) !important;
        line-height: var(--line-height) !important;
        letter-spacing: var(--letter-spacing) !important;
        word-spacing: var(--word-spacing) !important;
        max-width: var(--column-width) !important;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
    `;
    document.head.appendChild(style);
  }

  // Add class to all readable tags
  const readableTags = ['p', 'span', 'li', 'label', 'a', 'strong', 'em', 'blockquote', 'dd', 'dt', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  readableTags.forEach(tag => {
    document.querySelectorAll(tag).forEach(el => {
      el.classList.add('visionaid-text');
    });
  });

  // Reading ruler and bionic reading
  if (settings.readingRuler) enableReadingRuler();
  if (settings.bionicReading) enableBionicReading();
}

function getBackgroundColor(colorName) {
  const colors = {
    white: '#FFFFFF',
    cream: '#FFF5E6',
    cool: '#E6F0FA',
    mint: '#E6FFF6'
  };
  return colors[colorName] || '#FFFFFF';
}

function enableBionicReading() {
  const elements = document.querySelectorAll('p, div, span, article, section, li, a');
  elements.forEach(element => {
    if (!originalContents.has(element)) {
      originalContents.set(element, element.innerHTML);
    }
    const textNodes = getTextNodes(element);
    textNodes.forEach(node => {
      const words = node.textContent.trim().split(/\s+/);
      if (words.length === 0 || words[0] === '') return;
      const bionicWords = words.map(word => {
        const emphasizedLength = Math.ceil(word.length * 0.6);
        const emphasized = word.substring(0, emphasizedLength);
        const rest = word.substring(emphasizedLength);
        return `<span class="bionic-word"><strong>${emphasized}</strong>${rest}</span>`;
      });
      const newSpan = document.createElement('span');
      newSpan.innerHTML = bionicWords.join(' ');
      node.parentNode.replaceChild(newSpan, node);
    });
  });
}

function disableBionicReading() {
  const elements = document.querySelectorAll('p, div, span, article, section, li, a');
  elements.forEach(element => {
    if (originalContents.has(element)) {
      element.innerHTML = originalContents.get(element);
      originalContents.delete(element);
    }
  });
}

function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: node => {
        if (node.parentNode.classList.contains('bionic-word')) return NodeFilter.FILTER_REJECT;
        return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }
  return textNodes;
}

function enableReadingRuler() {
  if (document.getElementById('reading-ruler')) return;
  const ruler = document.createElement('div');
  ruler.id = 'reading-ruler';
  ruler.style.cssText = `
    position: fixed;
    left: 0;
    right: 0;
    height: 40px;
    background: rgba(255, 255, 0, 0.3);
    pointer-events: none;
    z-index: 2147483647;
    transition: top 0.1s ease;
  `;
  document.body.appendChild(ruler);

  document.addEventListener('mousemove', updateRulerPosition);
}

function disableReadingRuler() {
  const ruler = document.getElementById('reading-ruler');
  if (ruler) {
    ruler.remove();
  }
  document.removeEventListener('mousemove', updateRulerPosition);
}

function updateRulerPosition(e) {
  const ruler = document.getElementById('reading-ruler');
  if (ruler) {
    ruler.style.top = `${e.clientY - 20}px`;
  }
}

const filters = {
  protanopia: 'saturate(0.5) sepia(0.3) hue-rotate(-20deg)',
  deuteranopia: 'saturate(0.6) sepia(0.2) hue-rotate(20deg)',
  tritanopia: 'saturate(0.7) sepia(0.4) hue-rotate(180deg)',
  achromatopsia: 'grayscale(1)'
};

const correctionFilters = {
  protanopia: 'saturate(1.2) hue-rotate(20deg)',
  deuteranopia: 'saturate(1.3) hue-rotate(-20deg)',
  tritanopia: 'saturate(1.4) hue-rotate(-180deg)',
  achromatopsia: 'contrast(1.5) brightness(1.2) saturate(2)'
};

// Create and inject the filter overlay
const overlay = document.createElement('div');
overlay.id = 'vision-aid-overlay';
overlay.style.cssText = `
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483647;
  mix-blend-mode: normal;
`;
document.body.appendChild(overlay);

// Listen for messages
// content.js

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'applyFilter') {
    applyColorFilter(request.filter);
  } else if (request.action === 'applyDyslexiaStyles') {
    applyDyslexiaStyles(request.settings);
  } else if (request.action === 'removeDyslexiaStyles') {
    removeDyslexiaStyles();
  }
});

function applyColorFilter(filter) {
  let overlay = document.getElementById('vision-aid-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'vision-aid-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 999999,
      pointerEvents: 'none',
      mixBlendMode: 'normal'
    });
    document.body.appendChild(overlay);
  }
  overlay.style.backdropFilter = filter;
  overlay.style.webkitBackdropFilter = filter;
}

function applyDyslexiaStyles(settings) {
  removeDyslexiaStyles();

  // Set CSS variables for all settings
  document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
  document.documentElement.style.setProperty('--line-height', settings.lineSpacing);
  document.documentElement.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);
  document.documentElement.style.setProperty('--word-spacing', `${settings.wordSpacing}em`);
  document.documentElement.style.setProperty('--background-color', backgroundColorMap[settings.backgroundColor] || '#ffffff');
  document.documentElement.style.setProperty('--column-width', `${settings.columnWidth}px`);

  // Inject style if not present
  if (!document.getElementById('visionaid-dyslexia-styles')) {
    const style = document.createElement('style');
    style.id = 'visionaid-dyslexia-styles';
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Lexend&family=Andika&family=Atkinson+Hyperlegible&family=Comic+Neue&display=swap');
      @import url('https://fonts.cdnfonts.com/css/open-dyslexic');
      .visionaid-text {
        font-family: '${fontMap[settings.fontFamily] || 'OpenDyslexic'}', sans-serif !important;
        font-size: var(--font-size) !important;
        line-height: var(--line-height) !important;
        letter-spacing: var(--letter-spacing) !important;
        word-spacing: var(--word-spacing) !important;
        max-width: var(--column-width) !important;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
    `;
    document.head.appendChild(style);
  }

  // Add class to all readable tags
  const readableTags = ['p', 'span', 'li', 'label', 'a', 'strong', 'em', 'blockquote', 'dd', 'dt', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  readableTags.forEach(tag => {
    document.querySelectorAll(tag).forEach(el => {
      el.classList.add('visionaid-text');
    });
  });

  // Reading ruler and bionic reading
  if (settings.readingRuler) enableReadingRuler();
  if (settings.bionicReading) enableBionicReading();
}

function removeDyslexiaStyles() {
  document.querySelectorAll('.visionaid-text').forEach(el => {
    el.classList.remove('visionaid-text');
  });

  const style = document.getElementById('visionaid-dyslexia-styles');
  if (style) style.remove();

  // Do NOT set document.body.style.backgroundColor here!
  disableReadingRuler();
  disableBionicReading();
}

const backgroundColorMap = {
  white: '#ffffff',
  cream: '#fff5e6',
  cool: '#e6f0fa',
  mint: '#e6fff6'
};

function enableReadingRuler() {
  let ruler = document.getElementById('visionaid-ruler');
  if (!ruler) {
    ruler = document.createElement('div');
    ruler.id = 'visionaid-ruler';
    Object.assign(ruler.style, {
      position: 'fixed',
      left: 0,
      width: '100vw',
      height: '40px',
      backgroundColor: 'rgba(0,0,0,0.1)',
      pointerEvents: 'none',
      zIndex: 999998
    });
    document.body.appendChild(ruler);
    document.addEventListener('mousemove', updateRulerPosition);
  }
}

function updateRulerPosition(e) {
  const ruler = document.getElementById('visionaid-ruler');
  if (ruler) {
    ruler.style.top = `${e.clientY - 20}px`;
  }
}

function disableReadingRuler() {
  const ruler = document.getElementById('visionaid-ruler');
  if (ruler) ruler.remove();
  document.removeEventListener('mousemove', updateRulerPosition);
}

function enableBionicReading() {
  const maxNodes = 1000;
  let count = 0;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: node => {
        if (
          !node.parentNode ||
          node.parentNode.closest('script, style, noscript, iframe') ||
          node.textContent.trim().length < 4
        ) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) {
    if (count++ > maxNodes) break;
    nodes.push(walker.currentNode);
  }

  nodes.forEach(node => {
    const words = node.nodeValue.split(/(\s+)/);
    const transformed = words.map(word => {
      if (word.trim().length <= 2) return word;
      const splitIndex = Math.ceil(word.length / 2);
      return `<b>${word.slice(0, splitIndex)}</b>${word.slice(splitIndex)}`;
    }).join('');

    const span = document.createElement('span');
    span.innerHTML = transformed;
    node.parentNode.replaceChild(span, node);
  });
}

function disableBionicReading() {
  document.querySelectorAll('span').forEach(el => {
    if (el.innerHTML.includes('<b>')) {
      el.outerHTML = el.textContent;
    }
  });
}
