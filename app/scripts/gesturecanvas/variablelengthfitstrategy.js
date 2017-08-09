const VariableLengthFitStrategy_colors = [
  '#FF4511',
  '#1DABD6',
  '#FFBF49',
  '#13DB7E',
  '#72705B'
];

/**
 * Extends VariableLengthFitterBase with draw of matched gestures on canvas.
 */
class VariableLengthFitStrategy extends VariableLengthFitterBase {
  constructor(settings) {
    super(settings);

    this.name = 'Variable length';
    this.logger = new ConsoleLogger();
    this._paths = new Array();
  }

  init() {
    super.reset();
  }

  clear() {
    this._removePaths();
  }

  onKeyDown(event) {
    
  }


  onMouseDown(event) {}

  onMouseUp(event) {}

  hookNextFrame() {
    this._removePaths();
  }

  _removePaths() {
    for (var i = 0; i < this._paths.length; i++) {
      this._paths[i].remove();
    }
    this._paths.length = 0;
  }

  onFrame({
    point: {
      x,
      y
    }
  }) {
    this.insertPoint([x, y]);
  }

  processCurve(matchedPolynomials, residual, numberOfPoints) {
    const path = new paper.Path();
    GestureCanvas.appendMatchedPolynomialsToPath(matchedPolynomials, path);
    path.strokeColor = VariableLengthFitStrategy_colors[(Math.floor(numberOfPoints / this._frameSize) - 1) % VariableLengthFitStrategy_colors.length];
    this._paths.push(path);

    return false;
  }
}

/**
 * Performs match to gestures defined by objects, containing following fields:
 *  * type - as in http://paperjs.org/reference/curve/#classify.
 *  * inDir, outDir - objects with fields angle and margin.
 *  * averageResidual - threshold of accepted residual.
 *  * numberOfFrames - pair of numbers, giving threshold for NO of frames.
 *  * length - pair of numbers, giving threshold for length in pixels.
 * 
 */
class SimpleVariableLengthFitStrategy extends VariableLengthFitStrategy {
  constructor(settings) {
    super(settings);
    this._matcher = new GestureMatcher(settings);
    this._matched_path = null;
  }

  processCurve(matchedPolynomials, residual, numberOfPoints) {
    super.processCurve(matchedPolynomials, residual, numberOfPoints);

    var matchedGesture = this._matcher.tryToMatch(matchedPolynomials, residual, numberOfPoints);

    if (matchedGesture != null) {
      this.logger.log(`Matched gesture ${matchedGesture + 1}. (${this._matcher.debugDescriptionOfMatchedCurve()})`);
      this._addPath(matchedPolynomials);

      return true;
    }

    return false;
  }

  clear() {
    super.clear();

    if (this._matched_path) {
      this._matched_path.remove();
    }
  }

  onKeyDown({
    code
  }) {
    switch (code) {
      case 'KeyQ':
        this._matcher.tryMarkGesture(false);
        break;

      case 'KeyW':
        this._matcher.tryMarkGesture(true);
        break;
      default:
        break;
    }
  }

  _addPath(matchedPolynomials) {
    if (this._matched_path) {
      this._matched_path.remove();
    }

    this._matched_path = new paper.Path();
    GestureCanvas.appendMatchedPolynomialsToPath(matchedPolynomials, this._matched_path);
    this._matched_path.strokeColor = 'slateblue';
    this._matched_path.dashArray = [10, 4];
    this._matched_path.strokeWidth = 15;
  }
}

class SimpleDecisionTreeGestureMatcher extends SimpleVariableLengthFitStrategy {
  constructor(settings) {
    super(settings);
    this._matcher = new GestureMatcherWithTree(settings);
    this.name = 'Variable length (based on decision tree)';
    main.globalGestureDecisionTree.verifyGestureBase(settings.gestureDefinitions);
    main.globalGestureDecisionTree.retrainModels();
  } 
}