document.addEventListener('DOMContentLoaded', () => {
  // Element references with validation
  const visionType = document.getElementById('customSelect');
  const optionsList = document.getElementById('selectOptions');
  const correction = document.getElementById('correction');
  const dyslexiaSupport = document.getElementById('dyslexiaSupport');
  const fontFamilySelect = document.getElementById('fontFamilySelect');
  const fontFamilyOptions = document.getElementById('fontFamilyOptions');
  const fontSize = document.getElementById('fontSize');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const lineSpacing = document.getElementById('lineSpacing');
  const lineSpacingValue = document.getElementById('lineSpacingValue');
  const letterSpacing = document.getElementById('letterSpacing');
  const letterSpacingValue = document.getElementById('letterSpacingValue');
  const wordSpacing = document.getElementById('wordSpacing');
  const wordSpacingValue = document.getElementById('wordSpacingValue');
  const columnWidth = document.getElementById('columnWidth');
  const columnWidthValue = document.getElementById('columnWidthValue');
  const bgButtons = document.querySelectorAll('.bg-button');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const subPanels = document.querySelectorAll('.sub-panel');

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

  const defaultDyslexiaSettings = {
    fontFamily: 'opendyslexic',
    fontSize: 16,
    lineSpacing: 1.5,
    letterSpacing: 0,
    wordSpacing: 0,
    columnWidth: 800,
    backgroundColor: 'cream',
    readingRuler: true,
    bionicReading: true
  };

  // Tab Switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === tabId) {
          pane.classList.add('active');
        }
      });
    });
  });

  // Dropdowns
  const dropdowns = [
    { select: visionType, optionsId: 'selectOptions' },
    { select: fontFamilySelect, optionsId: 'fontFamilyOptions' }
  ].filter(d => d.select);

  dropdowns.forEach(({ select, optionsId }) => {
    select.addEventListener('click', (e) => {
      e.stopPropagation();
      select.classList.toggle('open');
      const options = document.getElementById(optionsId);
      if (options) {
        options.classList.toggle('open');
      }
    });
  });

  // Close dropdowns and sub-panels when clicking outside
  document.addEventListener('click', (e) => {
    dropdowns.forEach(({ select, optionsId }) => {
      if (!select.contains(e.target)) {
        select.classList.remove('open');
        const options = document.getElementById(optionsId);
        if (options) options.classList.remove('open');
      }
    });
    subPanels.forEach(panel => panel.classList.remove('active'));
  });

  // Vision Correction Dropdown
  if (optionsList) {
    optionsList.querySelectorAll('li').forEach(option => {
      option.addEventListener('click', () => {
        const selected = visionType.querySelector('.selected');
        selected.textContent = option.textContent;
        selected.dataset.value = option.dataset.value;
        visionType.classList.remove('open');
        optionsList.classList.remove('open');
        updateFilters();
      });
    });
  }

  // Font Family Dropdown
  if (fontFamilyOptions) {
    fontFamilyOptions.querySelectorAll('li').forEach(option => {
      option.addEventListener('click', () => {
        const selected = fontFamilySelect.querySelector('.selected');
        selected.textContent = option.textContent;
        selected.dataset.value = option.dataset.value;
        fontFamilySelect.classList.remove('open');
        fontFamilyOptions.classList.remove('open');
        updateDyslexiaSettings();
      });
    });
  }

  // Update Filters
  function updateFilters() {
    const selected = visionType.querySelector('.selected');
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

  if (correction) correction.addEventListener('change', updateFilters);

  // Update Dyslexia Settings
  function updateDyslexiaSettings() {
    const settings = {
      isEnabled: dyslexiaSupport.checked,
      fontFamily: fontFamilySelect.querySelector('.selected').dataset.value || 'none',
      fontSize: Number(fontSize.value),
      lineSpacing: Number(lineSpacing.value),
      letterSpacing: Number(letterSpacing.value),
      wordSpacing: Number(wordSpacing.value),
      columnWidth: Number(columnWidth.value),
      backgroundColor: document.querySelector('.bg-button.active')?.dataset.bg || 'white',
      readingRuler: readingRuler.classList.contains('active'),
      bionicReading: bionicReading.classList.contains('active')
    };

    chrome.storage.sync.set({ dyslexiaSettings: settings });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && settings.isEnabled) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'applyDyslexiaStyles',
          settings: settings
        });
      } else if (tabs[0] && !settings.isEnabled) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'removeDyslexiaStyles'
        });
      }
    });
  }

  // Sliders
  [fontSize, lineSpacing, letterSpacing, wordSpacing, columnWidth].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        const valueSpan = document.getElementById(`${input.id}Value`);
        valueSpan.textContent = input.value + (input.id === 'fontSize' ? 'px' : input.id === 'lineSpacing' ? 'x' : 'px');
        if (dyslexiaSupport.checked) {
          updateDyslexiaSettings();
        }
      });
    }
  });

  // Enable/Disable All
  if (dyslexiaSupport) {
    dyslexiaSupport.addEventListener('change', () => {
      const isEnabled = dyslexiaSupport.checked;

      if (isEnabled) {
        fontFamilySelect.querySelector('.selected').textContent = 'OpenDyslexic';
        fontFamilySelect.querySelector('.selected').dataset.value = 'opendyslexic';
        fontSize.value = defaultDyslexiaSettings.fontSize;
        fontSizeValue.textContent = `${defaultDyslexiaSettings.fontSize}px`;
        lineSpacing.value = defaultDyslexiaSettings.lineSpacing;
        lineSpacingValue.textContent = `${defaultDyslexiaSettings.lineSpacing}x`;
        letterSpacing.value = defaultDyslexiaSettings.letterSpacing;
        letterSpacingValue.textContent = `${defaultDyslexiaSettings.letterSpacing}px`;
        wordSpacing.value = defaultDyslexiaSettings.wordSpacing;
        wordSpacingValue.textContent = `${defaultDyslexiaSettings.wordSpacing}px`;
        columnWidth.value = defaultDyslexiaSettings.columnWidth;
        columnWidthValue.textContent = `${defaultDyslexiaSettings.columnWidth}px`;
        bgButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.bg === 'cream'));
        readingRuler.classList.add('active');
        bionicReading.classList.add('active');
      } else {
        fontSize.value = 16;
        fontSizeValue.textContent = '16px';
        lineSpacing.value = 1.5;
        lineSpacingValue.textContent = '1.5x';
        letterSpacing.value = 0;
        letterSpacingValue.textContent = '0px';
        wordSpacing.value = 0;
        wordSpacingValue.textContent = '0px';
        columnWidth.value = 800;
        columnWidthValue.textContent = '800px';
        bgButtons.forEach(btn => btn.classList.remove('active'));
        readingRuler.classList.remove('active');
        bionicReading.classList.remove('active');
      }

      updateDyslexiaSettings();
    });
  }

  // Background Color
  bgButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bgButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateDyslexiaSettings();
    });
  });

  // Reading Tools
  [readingRuler, bionicReading].forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      updateDyslexiaSettings();
    });
  });

  // Load Saved Settings
  chrome.storage.sync.get(['visionType', 'correction', 'dyslexiaSettings'], (data) => {
    if (data.visionType && visionType && optionsList) {
      const option = optionsList.querySelector(`li[data-value="${data.visionType}"]`);
      if (option) {
        visionType.querySelector('.selected').textContent = option.textContent;
        visionType.querySelector('.selected').dataset.value = data.visionType;
      }
    }
    if (data.correction && correction) correction.checked = data.correction;

    if (data.dyslexiaSettings) {
      const settings = data.dyslexiaSettings;
      if (dyslexiaSupport) dyslexiaSupport.checked = settings.isEnabled;
      if (fontFamilySelect) {
        fontFamilySelect.querySelector('.selected').textContent = settings.fontFamily.charAt(0).toUpperCase() + settings.fontFamily.slice(1);
        fontFamilySelect.querySelector('.selected').dataset.value = settings.fontFamily;
      }
      if (fontSize) fontSize.value = settings.fontSize;
      if (fontSizeValue) fontSizeValue.textContent = `${settings.fontSize}px`;
      if (lineSpacing) lineSpacing.value = settings.lineSpacing;
      if (lineSpacingValue) lineSpacingValue.textContent = `${settings.lineSpacing}x`;
      if (letterSpacing) letterSpacing.value = settings.letterSpacing;
      if (letterSpacingValue) letterSpacingValue.textContent = `${settings.letterSpacing}px`;
      if (wordSpacing) wordSpacing.value = settings.wordSpacing;
      if (wordSpacingValue) wordSpacingValue.textContent = `${settings.wordSpacing}px`;
      if (columnWidth) columnWidth.value = settings.columnWidth;
      if (columnWidthValue) columnWidthValue.textContent = `${settings.columnWidth}px`;
      bgButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.bg === settings.backgroundColor));
      if (readingRuler) readingRuler.classList.toggle('active', settings.readingRuler);
      if (bionicReading) bionicReading.classList.toggle('active', settings.bionicReading);
    }

    updateFilters();
    updateDyslexiaSettings();
  });
});