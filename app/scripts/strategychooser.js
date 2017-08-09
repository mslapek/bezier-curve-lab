/**
 * Represents strategy chooser element.
 */
class StrategyChooser {
  constructor({
    selectElement,
    strategies,
    gestureCanvas,
    applyButton,
    settingsToCollect
  }) {
    this._selectElement = selectElement;
    this._strategies = strategies;
    this._gestureCanvas = gestureCanvas;
    this._settingsToCollect = settingsToCollect;

    while (selectElement.hasChildNodes()) {
      selectElement.removeChild(selectElement.lastChild);
    }

    this._settings = { hiddenOptions: {} };
    this._collectSettings();

    for (var i = 0; i < strategies.length; i++) {
      const strategy = strategies[i](this._settings);
      const element = document.createElement('option');
      element.textContent = strategy.name;
      selectElement.appendChild(element);
    }

    selectElement.addEventListener('change', () => this._changed());
    applyButton.addEventListener('click', () => this._changed());
  }
  
  onKeyDown(event) {
    this._gestureCanvas.fitStrategy.onKeyDown(event);
  }

  _changed() {
    
    var newStrategy = null;
    this._gestureCanvas.fitStrategy.clear();

    try {
      this._collectSettings();
      newStrategy = this._strategies[this._selectElement.selectedIndex](this._settings);
      this._gestureCanvas.fitStrategy = newStrategy;
      newStrategy.init();
    } catch (error) {
      main.error(`Unable to initialize fitter: ${error}`);
    }

    if (newStrategy) {
      main.log(`Changed to "${newStrategy.name}"`);
    }

    main.globalGestureDecisionTree.verifyGestureBase(this._settings.gestureDefinitions);
  }

  _collectSettings() {
    const hiddenOptions = this._settings.hiddenOptions;
    this._settings = {hiddenOptions};

    this._settingsToCollect.forEach(([elementId, optionName]) => {
      switch (typeof elementId) {
        case 'string':
          const node = document.getElementById(elementId);
          this._settings[optionName] = node.value;
          break;

        default:
          this._settings[optionName] = elementId();
          break;
      }

    });
  }
}
