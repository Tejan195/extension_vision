let originalContents = new WeakMap(); // Store original content for Bionic Reading

// Dyslexia support functions
function applyDyslexiaStyles(settings) {
  // Inject font styles
  if (!document.getElementById('dyslexia-font-style')) {
    const style = document.createElement('style');
    style.id = 'dyslexia-font-style';
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&family=Andika&family=Atkinson+Hyperlegible&family=Comic+Neue:wght@400;700&display=swap');
      @import url('https://fonts.cdnfonts.com/css/open-dyslexic');
      .dyslexia-font-lexend { font-family: 'Lexend', Arial, sans-serif !important; }
      .dyslexia-font-opendyslexic { font-family: 'OpenDyslexic', Arial, sans-serif !important; }
      .dyslexia-font-andika { font-family: 'Andika', Arial, sans-serif !important; }
      .dyslexia-font-atkinson { font-family: 'Atkinson Hyperlegible', Arial, sans-serif !important; }
      .dyslexia-font-comic-neue { font-family: 'Comic Neue', Arial, sans-serif !important; }
      body, p, div, span, h1, h2, h3, h4, h5, h6, li, a, article, section {
        font-size: var(--font-size, ${settings.fontSize}px) !important;
        line-height: var(--line-height, ${settings.lineSpacing}) !important;
        letter-spacing: var(--letter-spacing, ${settings.letterSpacing}em) !important;
        word-spacing: var(--word-spacing, ${settings.wordSpacing}em) !important;
      }
      body {
        background-color: var(--background-color, ${getBackgroundColor(settings.backgroundColor)}) !important;
        max-width: ${settings.columnWidth}px !important;
        margin: 0 auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Apply font family
  const fontClass = `dyslexia-font-${settings.fontFamily}`;
  document.body.classList.remove(
    'dyslexia-font-lexend',
    'dyslexia-font-opendyslexic',
    'dyslexia-font-andika',
    'dyslexia-font-atkinson',
    'dyslexia-font-comic-neue'
  );
  if (settings.fontFamily !== 'none') {
    document.body.classList.add(fontClass);
  }

  // Update CSS custom properties
  document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
  document.documentElement.style.setProperty('--line-height', settings.lineSpacing);
  document.documentElement.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);
  document.documentElement.style.setProperty('--word-spacing', `${settings.wordSpacing}em`);
  document.documentElement.style.setProperty('--background-color', getBackgroundColor(settings.backgroundColor));

  // Apply Bionic Reading
  if (settings.bionicReading) {
    enableBionicReading();
  } else {
    disableBionicReading();
  }

  // Apply Reading Ruler
  if (settings.readingRuler) {
    enableReadingRuler();
  } else {
    disableReadingRuler();
  }
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content.js:', message);
  if (message.action === 'applyFilter') {
    overlay.style.filter = message.filter || 'none';
  }
  if (message.action === 'applyDyslexiaStyles') {
    applyDyslexiaStyles(message.settings);
  }
  if (message.action === 'removeDyslexiaStyles') {
    document.documentElement.style.removeProperty('--font-size');
    document.documentElement.style.removeProperty('--line-height');
    document.documentElement.style.removeProperty('--letter-spacing');
    document.documentElement.style.removeProperty('--word-spacing');
    document.documentElement.style.removeProperty('--background-color');
    document.body.classList.remove(
      'dyslexia-font-lexend',
      'dyslexia-font-opendyslexic',
      'dyslexia-font-andika',
      'dyslexia-font-atkinson',
      'dyslexia-font-comic-neue'
    );
    document.body.style.removeProperty('background-color');
    document.body.style.removeProperty('max-width');
    document.body.style.removeProperty('margin');
    disableBionicReading();
    disableReadingRuler();
  }
});

// Load saved settings
chrome.storage.sync.get(['visionType', 'correction', 'dyslexiaSettings'], (settings) => {
  if (settings.visionType) {
    const filter = settings.correction ? correctionFilters[settings.visionType] : filters[settings.visionType];
    overlay.style.filter = filter;
  }
  if (settings.dyslexiaSettings && settings.dyslexiaSettings.isEnabled) {
    applyDyslexiaStyles(settings.dyslexiaSettings);
  }
});