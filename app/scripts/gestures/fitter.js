/*
  Gesture Fitter
  Michał Słapek
*/

class NotEnoughPointsException {
  constructor() {
  }
}

/**
 * Mathematical utilities to perform calculations by curve fitters.
 */
class FitterUtilities {
  constructor() {

  }

  /**
   * Calculate XTX matrix for cubic bezier curves.
   * 
   * @param {numeric} n - Number of observed points.
   * @return Calculated XTX matrix as array of arrays of numbers.
   */
  static getXTXMatrix(n) {
    const n2 = n * n, n3 = n2 * n, n4 = n3 * n, n5 = n4 * n;
    return [[n, n/2 + 1/2, n/3 + 1/2 + 1/(6*n), (n2 + 2*n + 1)/(4*n)], [n/2 + 1/2, n/3 + 1/2 + 1/(6*n), (n2 + 2*n + 1)/(4*n), n/5 + 1/2 + 1/(3*n) - 1/(30*n3)], [n/3 + 1/2 + 1/(6*n), (n2 + 2*n + 1)/(4*n), n/5 + 1/2 + 1/(3*n) - 1/(30*n3), n/6 + 1/2 + 5/(12*n) - 1/(12*n3)], [(n2 + 2*n + 1)/(4*n), n/5 + 1/2 + 1/(3*n) - 1/(30*n3), n/6 + 1/2 + 5/(12*n) - 1/(12*n3), n/7 + 1/2 + 1/(2*n) - 1/(6*n3) + 1/(42*n5)]];
  }

  static calculateSumOfPolynomialAtParameters(matchedPolynomial, n) {
    const a0 = matchedPolynomial[0],
      a1 = matchedPolynomial[1],
      a2 = matchedPolynomial[2],
      a3 = matchedPolynomial[3];
    const n2 = n * n, n3 = n2 * n, n4 = n3 * n, n5 = n4 * n;
    return a0*a1 + a0*a2 + a0*a3 + a1*a1/2 + a1*a2 + a1*a3 + a2*a2/2 + a2*a3 + a3*a3/2 + a3*a3/(42*n5) + n*(a0*a0 + a0*a1 + 2*a0*a2/3 + a0*a3/2 + a1*a1/3 + a1*a2/2 + 2*a1*a3/5 + a2*a2/5 + a2*a3/3 + a3*a3/7) + (a0*a2/3 + a0*a3/2 + a1*a1/6 + a1*a2/2 + 2*a1*a3/3 + a2*a2/3 + 5*a2*a3/6 + a3*a3/2)/n + (-a1*a3/15 - a2*a2/30 - a2*a3/6 - a3*a3/6)/n3;
  }

  static mathematicModulo(a, b) {
    const value = a % b;
    if (value < 0) {
      return value + b;
    }
    else {
      return value;
    }
  }

  /**
   * Converts polynomial coefficients into control points.
   * @param polynomials - Matched polynomials.
   * @returns Array of control points.
   */
  static matchedPolynomialToBezierHandles([a0, a1, a2, a3]) {
    const p0 = a0, p3 = a0 + a1 + a2 + a3;
    return [
      p0,
      a1 / 3.0 + p0,
      p3 - (a1 + 2 * a2 + 3 * a3) / 3.0,
      p3
    ];
  }

  /**
   * Converts polynomial coefficients into control points.
   * @param polynomials - Matched polynomials.
   * @returns Array of control points.
   */
  static matchedPlanePolynomialsToBezierHandles([polynomial1, polynomial2]) {
    const [px0, px1, px2, px3] = FitterUtilities.matchedPolynomialToBezierHandles(polynomial1);
    const [py0, py1, py2, py3] = FitterUtilities.matchedPolynomialToBezierHandles(polynomial2);

    return [
      [px0, py0], [px1, py1], [px2, py2], [px3, py3]
    ];
  }
}

/**
 * Fits sequence to a curve on a line.
 */
class SingleDimensionFitter {
  constructor() {
    this._sum_vt = [0.0, 0.0, 0.0, 0.0];
    this.reset();
  }

  /**
   * Reset counters.
   */
  reset() {
    this._nopoints = 0;
    this._squareSum = 0.0;

    const length = this._sum_vt.length;
    for(var i = 0; i < length; ++i) {
      this._sum_vt[i] = 0.0;
    }
  }

  /**
   * Insert point.
   * 
   * @param {number} value - The observed value on single dimension. 
   */
  insertPoint(value) {
    const nextId = this._nopoints + 1;

    const length = this._sum_vt.length;
    for(var i = 0; i < length; ++i) {
      this._sum_vt[i] += value;
      value *= nextId;
    }

    this._squareSum += value * value;
    this._nopoints = nextId;
  }

  /**
   * 
   * @param xtxMatrix - XTX matrix from FitterUtilities.getXTXMatrix.
   * @returns Pair with polynomial and residual.
   */
  fitCurve(xtxMatrix) {
    if (this._nopoints < 4) {
      throw new NotEnoughPointsException();
    }


    const length = this._sum_vt.length;
    const sum_vt = new Array(length);
    var divisor = 1.0;

    for(var i = 0; i < length; ++i) {
      sum_vt[i] = this._sum_vt[i] / divisor;
      divisor *= this._nopoints;
    }

    const matchedPolynomial = numeric.solve(xtxMatrix, sum_vt);
    const sumBtv = numeric.dotVV(matchedPolynomial, sum_vt),
      residual = FitterUtilities.calculateSumOfPolynomialAtParameters(matchedPolynomial, this._nopoints)
        + this._squareSum - 2 * sumBtv;

    return [matchedPolynomial, residual];
  }

  get numberOfPoints() {
    return this._nopoints;
  }
}

/**
 * Fits sequence to a curve on a plane.
 */
class PlaneFitter {
  constructor() {
    this._fitter1 = new SingleDimensionFitter();
    this._fitter2 = new SingleDimensionFitter();
  }

  /**
   * Reset counters.
   */
  reset() {
    this._fitter1.reset();
    this._fitter2.reset();
  }

  /**
   * Insert point.
   * 
   * @param point - The observed value on single dimension. 
   */
  insertPoint([x, y]) {
    this._fitter1.insertPoint(x);
    this._fitter2.insertPoint(y);
  }

  /**
   * 
   * @param xtxMatrix - XTX matrix from FitterUtilities.getXTXMatrix.
   * @returns Pair with polynomials and residual.
   */
  fitCurve(xtxMatrix) {
    const xtx = xtxMatrix ? xtxMatrix : FitterUtilities.getXTXMatrix(this._fitter1.numberOfPoints);

    const [polynomial1, residual1] = this._fitter1.fitCurve(xtx);
    const [polynomial2, residual2] = this._fitter2.fitCurve(xtx);
    return [[polynomial1, polynomial2], residual1 + residual2];
  }

  get numberOfPoints() {
    return this._fitter1.numberOfPoints;
  }
}
/**
 * Abstract class for variable length gestures detectors.
 * Has abstract methods processCurve and hookNextFrame.
 */
class VariableLengthFitterBase {
  constructor({frameSize, gestureSpan}) {
    this._frameSize = frameSize;
    this._gestureSpan = gestureSpan;

    this._noOfPointsInCurrentFrame = 0;
    this._lastResetInCycle = 0;

    this._fitters = new Array(gestureSpan);
    for (var i = 0; i < gestureSpan; i++) {
      this._fitters[i] = new PlaneFitter();
    }
  }

  /**
   * Reset counters.
   */
  reset() {
    for (var i = 0; i < this._gestureSpan; i++) {
      this._fitters[i].reset();
    }
    this._lastResetInCycle = 0;
  }

  /**
   * Insert point.
   * 
   * @param point - The observed value on single dimension. 
   */
  insertPoint(point) {
    this._insertPointToAllFitters(point);
    ++this._noOfPointsInCurrentFrame;

    if(this._noOfPointsInCurrentFrame >= this._frameSize) {
      this._noOfPointsInCurrentFrame = 0;
      this._resetNextInCycle();
      this.hookNextFrame();
      this._tryToFitCurve();
    }
  }

  _insertPointToAllFitters(point) {
    const gestureSpan = this._gestureSpan;
    for (var i = 0; i < gestureSpan; i++) {
      this._fitters[i].insertPoint(point);
    }
  }

  _resetNextInCycle() {
    this._lastResetInCycle = (this._lastResetInCycle + 1) % this._gestureSpan;
    this._fitters[this._lastResetInCycle].reset();
  }

  _tryToFitCurve() {
    const gestureSpan = this._gestureSpan;
    for (var i = 1; i <= gestureSpan; i++) {
      const fitter = this._fitters[FitterUtilities.mathematicModulo(
          this._lastResetInCycle + i,
          gestureSpan)];
      const xtxMatrix = FitterUtilities.getXTXMatrix(fitter.numberOfPoints);

      var matchedPolynomials, residual;

      try {
        [matchedPolynomials, residual] = fitter.fitCurve(xtxMatrix);
      } catch (e) {
        if (e instanceof NotEnoughPointsException) {
          continue;
        } else {
          throw e;
        }
      }


      if(this.processCurve(matchedPolynomials, residual, fitter.numberOfPoints))
      {
        this.reset();
        return;
      }
    }
  }

  /**
   * Process matched polynomials.
   * 
   * @param {} matchedPolynomials 
   * @param {*} residual 
   * @param {*} numberOfPoints 
   * @returns Logical value indicating whether a gesture was detected.
   */
  processCurve(matchedPolynomials, residual, numberOfPoints) {
     throw new TypeError('Do not call abstract method processCurve.');
  }

  /**
   * Hook called at start of next frame.
   */
  hookNextFrame() {
    return;
  }
}
