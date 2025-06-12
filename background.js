// Handle system-wide color correction
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applyFilter') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          css: `
            html {
              filter: ${request.filter} !important;
            }
          `
        }).catch(() => {
          // Ignore chrome:// and edge:// URLs that don't allow injection
        });
      });
    });
  }
});

// Apply saved filter on startup
chrome.storage.sync.get(['visionType', 'correction'], (settings) => {
  if (settings.visionType) {
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

    const filter = settings.correction 
      ? correctionFilters[settings.visionType] 
      : filters[settings.visionType];

    chrome.runtime.sendMessage({
      action: 'applyFilter',
      filter: filter
    });
  }
});