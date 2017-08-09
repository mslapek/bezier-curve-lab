/**
 * Fit strategy, where user passes information about beginning and end of gesture
 * via mouse button.
 */
class SignaledFitStrategy {
  constructor(settings) {
    this.name = 'Signaled';

    this._fitter = new PlaneFitter();
    this.richDraw = true;
    this.logger = new ConsoleLogger();

    this._path = null;

    this._matcher = new GestureMatcher(settings);
  }

  init() {

  }

  clear() {
    if (this._path) {
      this._path.remove();
    }
  }

  onMouseDown(event) {
    this._fitter.reset();
  }

  onMouseUp(event) {
    [this.matchedPolynomials, this.residual] = this._fitter.fitCurve();
    this.clear();

    const path = new paper.Path();
    this._path = path;
    GestureCanvas.appendMatchedPolynomialsToPath(this.matchedPolynomials, path);
    path.strokeColor = 'red';

    const curve = path.firstCurve;
    this.logger.log(`Matched polynomial with avg residual ${Math.sqrt(this.residual) / this._fitter.numberOfPoints} classified as ${curve.classify().type}.`);

    var matchedGesture = this._matcher.tryToMatch(this.matchedPolynomials, this.residual, this._fitter.numberOfPoints);

    if (matchedGesture != null) {
      this.logger.log(`Matched gesture ${matchedGesture + 1}. (${this._matcher.debugDescriptionOfMatchedCurve()})`);
    } else {
      this.logger.log('No gesture detected.');
    }
  }

  onFrame({
    point: {
      x,
      y
    }
  }) {
    this._fitter.insertPoint([x, y]);
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
}
