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
chrome.runtime.onMessage.addListener((settings) => {
  if (!settings.visionType) {
    overlay.style.filter = 'none';
    return;
  }
  
  const filter = settings.correction ? correctionFilters[settings.visionType] : filters[settings.visionType];
  overlay.style.filter = filter;
});

// Load saved settings
chrome.storage.sync.get(['visionType', 'correction'], (settings) => {
  if (settings.visionType) {
    const filter = settings.correction ? correctionFilters[settings.visionType] : filters[settings.visionType];
    overlay.style.filter = filter;
  }
});