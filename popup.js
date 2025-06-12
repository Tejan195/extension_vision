const visionType = document.getElementById('visionType');
const correction = document.getElementById('correction');

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

// Load saved settings
chrome.storage.sync.get(['visionType', 'correction'], (data) => {
  if (data.visionType) visionType.value = data.visionType;
  if (data.correction) correction.checked = data.correction;
});

// Save settings and apply system-wide filters
function updateFilters() {
  const settings = {
    visionType: visionType.value,
    correction: correction.checked
  };
  
  chrome.storage.sync.set(settings);
  
  if (!settings.visionType) {
    chrome.runtime.sendMessage({
      action: 'applyFilter',
      filter: 'none'
    });
    return;
  }

  const filter = settings.correction 
    ? correctionFilters[settings.visionType] 
    : filters[settings.visionType];

  chrome.runtime.sendMessage({
    action: 'applyFilter',
    filter: filter
  });
}

visionType.addEventListener('change', updateFilters);
correction.addEventListener('change', updateFilters);