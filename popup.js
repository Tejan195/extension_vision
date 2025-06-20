const visionType = document.getElementById('customSelect');
const optionsList = document.getElementById('selectOptions');
const selected = document.querySelector('.selected');
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

// Custom dropdown behavior
visionType.addEventListener('click', () => {
  visionType.classList.toggle('open');
  optionsList.classList.toggle('open');
});

optionsList.querySelectorAll('li').forEach((option) => {
  option.addEventListener('click', () => {
    selected.textContent = option.textContent;
    selected.dataset.value = option.dataset.value;
    visionType.classList.remove('open');
    optionsList.classList.remove('open');
    updateFilters();
  });
});

document.addEventListener('click', (e) => {
  if (!visionType.contains(e.target)) {
    visionType.classList.remove('open');
    optionsList.classList.remove('open');
  }
});

// Load saved settings
const dyslexiaSettings = { fontSize: 18, lineSpacing: 1.8, letterSpacing: 0.5, wordSpacing: 0.3, backgroundColor: 'cream', bionicReading: true };

chrome.storage.sync.get(['dyslexiaSupport'], (data) => {
  if (data.dyslexiaSupport) {
    setFontSize(dyslexiaSettings.fontSize);
    setLineSpacing(dyslexiaSettings.lineSpacing);
    setLetterSpacing(dyslexiaSettings.letterSpacing);
    setWordSpacing(dyslexiaSettings.wordSpacing);
    setBackgroundColor(dyslexiaSettings.backgroundColor);
    setBionicReading(dyslexiaSettings.bionicReading);
  }
});
chrome.storage.sync.get(['visionType', 'correction'], (data) => {
  if (data.visionType) {
    const selectedOption = optionsList.querySelector(`li[data-value="${data.visionType}"]`);
    if (selectedOption) {
      selected.textContent = selectedOption.textContent;
      selected.dataset.value = selectedOption.dataset.value;
    }
  }
  if (data.correction) correction.checked = data.correction;
  updateFilters(); // apply on load
});

// Save and apply filters
function updateFilters() {
  const value = selected.dataset.value || 'normal';
  const correctionEnabled = correction.checked;

  chrome.storage.sync.set({
    visionType: value,
    correction: correctionEnabled
  });

  const filter = correctionEnabled
    ? correctionFilters[value] || 'none'
    : filters[value] || 'none';

  chrome.runtime.sendMessage({
    action: 'applyFilter',
    filter: filter
  });
}

correction.addEventListener('change', updateFilters);

// Dyslexia Support Toggle
const dyslexiaSupport = document.getElementById('dyslexiaSupport');

dyslexiaSupport.addEventListener('change', () => {
  const isEnabled = dyslexiaSupport.checked;
  
  chrome.storage.sync.set({
    dyslexiaSupport: isEnabled
  });

  if (isEnabled) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'applyDyslexiaStyles',
        settings: dyslexiaSettings
      });
    });
  } else {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'removeDyslexiaStyles'
      });
    });
  }
});
