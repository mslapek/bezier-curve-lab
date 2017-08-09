/**
 * Redirects logs to console.
 */
class ConsoleLogger {
  log(message) {
    main.log(message);
  }
}

/**
 * Representation of gesture canvas. Draws on default paper.js canvas.
 * Has field fitStrategy, which is initially set to instance of NullFitStrategy.
 */
class GestureCanvas {
  constructor() {
    this.fitStrategy = new NullFitStrategy();
    this._mousePosition = {x: 0, y: 0};
    this.paused = false;

    var gestureInputTool = new paper.Tool();
    gestureInputTool.onMouseMove = (event) => this._updateMouseCoords(event.point);
    gestureInputTool.onMouseDown = (event) => this.fitStrategy.onMouseDown({point: this._mousePosition});
    gestureInputTool.onMouseUp = (event) => this.fitStrategy.onMouseUp({point: this._mousePosition});

    this.traceLength = 300;
    this._traceOnPaper = new paper.Path();
    this._traceOnPaper.strokeColor = 'blue';

    window.setInterval(() => this._onUpdate(), 10);
  }

  _updateMouseCoords(point) {
    this._mousePosition = point;
  }

  _onUpdate() {
    if(this.paused) {
      return;
    }

    this._traceOnPaper.add(this._mousePosition);

    if (this._traceOnPaper.segments.length > this.traceLength) {
      this._traceOnPaper.removeSegment(0);
    }

    this.fitStrategy.onFrame({point: this._mousePosition});
  }

  static appendMatchedPolynomialsToPath(matchedPolynomials, path) {
    const controlPoints = FitterUtilities
      .matchedPlanePolynomialsToBezierHandles(matchedPolynomials)
      .map(([x, y]) => new paper.Point(x, y));

    path.add(controlPoints[0]);
    path.cubicCurveTo(controlPoints[1], controlPoints[2], controlPoints[3]);
  }
}

/**
 * Null fit strategy.
 */
class NullFitStrategy {
  constructor() {
    this.name = 'Turn off';
  }

  init() {
  }

  clear() {
  }

  onMouseDown(event) {
  }

  onMouseUp(event) {
  }

  onFrame({point: {x, y}}) {
  }

  onKeyDown(event) {    
  }

  set richDraw(value) {
  }

  set logger(value) {
  }
}
