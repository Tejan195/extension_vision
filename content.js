// Dyslexia support functions
function applyDyslexiaStyles(settings) {
  // Inject font if not already present
  if (!document.getElementById('dyslexia-font-style')) {
    const style = document.createElement('style');
    style.id = 'dyslexia-font-style';
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&family=OpenDyslexic&display=swap');
      .dyslexia-font-lexend { font-family: 'Lexend', Arial, sans-serif !important; }
      .dyslexia-font-opendyslexic { font-family: 'OpenDyslexic', Arial, sans-serif !important; }
    `;
    document.head.appendChild(style);
  }
  // Default to OpenDyslexic for demo
  document.body.classList.remove('dyslexia-font-lexend','dyslexia-font-opendyslexic');
  document.body.classList.add('dyslexia-font-opendyslexic');
  document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
  document.documentElement.style.setProperty('--line-height', settings.lineSpacing);
  document.documentElement.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);
  document.documentElement.style.setProperty('--word-spacing', `${settings.wordSpacing}em`);
  document.documentElement.style.setProperty('--background-color', settings.backgroundColor);
  if (settings.bionicReading) {
    enableBionicReading();
  } else {
    disableBionicReading();
  }
}

function enableBionicReading() {
  const paragraphs = document.querySelectorAll('p, article, section');
  paragraphs.forEach(paragraph => {
    const words = paragraph.textContent.split(' ');
    const bionicWords = words.map(word => {
      const emphasizedLength = Math.ceil(word.length * 0.6);
      const emphasized = word.substring(0, emphasizedLength);
      const rest = word.substring(emphasizedLength);
      return `<span class="bionic-word"><strong>${emphasized}</strong>${rest}</span>`;
    });
    paragraph.innerHTML = bionicWords.join(' ');
  });
}

function disableBionicReading() {
  const bionicWords = document.querySelectorAll('.bionic-word');
  bionicWords.forEach(word => {
    const text = word.textContent;
    word.replaceWith(text);
  });
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

// Listen for filter updates from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'applyFilter') {
    if (!message.filter) {
      overlay.style.filter = 'none';
      return;
    }
    overlay.style.filter = message.filter;
  }
  if (message.action === 'applyDyslexiaStyles') {
    applyDyslexiaStyles(message.settings);
  }
  if (message.action === 'removeDyslexiaStyles') {
    // Reset dyslexia styles
    document.documentElement.style.removeProperty('--font-size');
    document.documentElement.style.removeProperty('--line-height');
    document.documentElement.style.removeProperty('--letter-spacing');
    document.documentElement.style.removeProperty('--word-spacing');
    document.documentElement.style.removeProperty('--background-color');
    disableBionicReading();
  }
});

// Load saved settings
chrome.storage.sync.get(['visionType', 'correction'], (settings) => {
  if (settings.visionType) {
    const filter = settings.correction ? correctionFilters[settings.visionType] : filters[settings.visionType];
    overlay.style.filter = filter;
  }
});