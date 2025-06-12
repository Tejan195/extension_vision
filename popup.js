const dropdown = document.getElementById('customDropdown');
const selected = dropdown.querySelector('.selected');
const options = dropdown.querySelectorAll('.dropdown li');
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

document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['visionType', 'correction'], (data) => {
    if (data.visionType) {
      selected.textContent = optionsNamed(data.visionType) || 'Normal Vision';
      dropdown.dataset.value = data.visionType;
    }
    if (data.correction !== undefined) {
      correction.checked = data.correction;
    }
  });

  // Open/close dropdown
  dropdown.addEventListener('click', () => {
    dropdown.classList.toggle('open');
  });

  // Option click
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      selected.textContent = option.textContent;
      dropdown.dataset.value = option.dataset.value;
      dropdown.classList.remove('open');
      updateFilters();
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // Toggle handler
  correction.addEventListener('change', updateFilters);
});

// Helper to get label
function optionsNamed(value) {
  const option = [...options].find(opt => opt.dataset.value === value);
  return option ? option.textContent : null;
}

// Filter logic
function updateFilters() {
  const visionType = dropdown.dataset.value || '';
  const correctionEnabled = correction.checked;

  chrome.storage.sync.set({ visionType, correction: correctionEnabled });

  if (!visionType) {
    chrome.runtime.sendMessage({ action: 'applyFilter', filter: 'none' });
    return;
  }

  const filter = correctionEnabled
    ? correctionFilters[visionType]
    : filters[visionType];

  chrome.runtime.sendMessage({ action: 'applyFilter', filter });
}
