/**
 * Extracts features from matched curve.
 */
class FeatureExtractor {
  constructor({
    frameSize
  }) {
    this._frameSize = frameSize;
  }

  /**
   * Get features from curve. Sets property this.recentFeatures.
   * @returns Dictionary with features.
   */
  extractFeatures(matchedPolynomials, residual, numberOfPoints) {
    this._match_path = new paper.Path();
    GestureCanvas.appendMatchedPolynomialsToPath(matchedPolynomials, this._match_path);
    this._curve = this._match_path.firstCurve;

    this._match_type = this._curve.classify().type;
    this._match_averageResidual = residual / numberOfPoints;
    this._match_frameNumber = Math.floor(numberOfPoints / this._frameSize) - 1;
    this._match_length = this._curve.length;
    this._calculateDirections();
    this._calculateProportionInsideLoop();

    this.recentFeatures = {
      'type': this._match_type,
      'averageResidual': this._match_averageResidual,
      'frameNumber': this._match_frameNumber,
      'length': this._curve.length,
      'angleIn': this._match_inDirPoint.angle,
      'angleOut': this._match_outDirPoint.angle,
      'tangentIn': this._match_inDirPoint,
      'tangentOut': this._match_outDirPoint,
      'proportionInsideLoop': this._match_proportionInsideLoop
    };

    return this.recentFeatures;
  }


  _calculateDirections() {
    var t1 = 0.2,
      t2 = 0.8;

    this._match_intersectionTime1 = -1;
    this._match_intersectionTime2 = -1;

    if (this._match_type == 'loop') {
      var [intersection] = this._curve.getIntersections();
      t1 = intersection.time;
      t2 = intersection.intersection.time;
      this._match_intersectionTime1 = t1;
      this._match_intersectionTime2 = t2;
    }

    this._match_inDirPoint = this._calculateDirection(t1)
    this._match_outDirPoint = this._calculateDirection(t2)
  }

  _calculateProportionInsideLoop() {
    if (this._match_intersectionTime1 < 0) {
      this._match_proportionInsideLoop = 1;      
    }
    else {
      var curveSubset = this._curve.getPart(this._match_intersectionTime1,
          this._match_intersectionTime2);
      var subsetLength = curveSubset.length;
      this._match_proportionInsideLoop = subsetLength / this._match_length;
    }
  }

  _calculateDirection(time) {
    return this._curve.getTangentAtTime(time);
  }

  /**
   * Returns recentFeatures as array. 
   * @param {object} extractedFeatures - Result from method extractFeatures.
   * @param {array} usedFeaturesInRow - Names of features to be used.
   * @param {*} gestureClass - Optional object appended to the end of array.
   */
  static extractAsRow(extractedFeatures, usedFeaturesInRow, gestureClass) {
    var row = [];
    for (var featureNumber = 0; featureNumber < usedFeaturesInRow.length; featureNumber++) {
      var featureName = usedFeaturesInRow[featureNumber];
      row[featureNumber] = extractedFeatures[featureName];
    }

    if (gestureClass != null) {
      row[usedFeaturesInRow.length] = gestureClass;
    }

    return row;
  }
}

class GestureMatcher {
  constructor(settings) {
    this.gestures = settings.gestureDefinitions;
    this.featureExtractor = new FeatureExtractor(settings);
    this.logger = new ConsoleLogger();
  }

  tryToMatch(matchedPolynomials, residual, numberOfPoints) {
    this._features = this.featureExtractor.extractFeatures(matchedPolynomials, residual, numberOfPoints)

    for (var i = 0; i < this.gestures.length; i++) {
      var gesture = this.gestures[i];

      var typeSatisfied = !gesture['type'] || gesture.type == this._features.type;
      var inDirSatisfied = !gesture['inDir'] || this._directionSatisfied(this._features.tangentIn, gesture.inDir);
      var outDirSatisfied = !gesture['outDir'] || this._directionSatisfied(this._features.tangentOut, gesture.outDir);
      var averageResidualSatisfied = !gesture['averageResidual'] || this._features.averageResidual < gesture.averageResidual;
      var numberOfFramesSatisfied = !gesture['numberOfFrames'] ||
        (gesture.numberOfFrames[0] <= this._features.frameNumber && this._features.frameNumber <= gesture.numberOfFrames[1]);
      var lengthSatisfied = !gesture['length'] ||
        (gesture.length[0] <= this._features.length && this._features.length <= gesture.length[1]);

      var matched = typeSatisfied &&
        inDirSatisfied &&
        outDirSatisfied &&
        averageResidualSatisfied &&
        numberOfFramesSatisfied;

      if (matched) {
        var additionalCheckSatisfied = this.performAdditionalCheck(matchedPolynomials, residual, numberOfPoints, i);
        matched = additionalCheckSatisfied;
      }

      if (matched) {
        this._recentMatchedGestureFeatures = this._features;
        this._recentMatchedGestureIndex = i;

        return i;
      }
    }

    return null;
  }

  /**
   * Hook, which can be overridden by child classes.
   * @param {*} matchedPolynomials 
   * @param {*} residual 
   * @param {*} numberOfPoints 
   * @param {number} matchedGestureIndex
   */
  performAdditionalCheck(matchedPolynomials, residual, numberOfPoints, matchedGestureIndex) {
    return true;
  }

  debugDescriptionOfMatchedCurve() {
    return `FR=${this._features.frameNumber}, LN=${this._features.length}`;
  }

  /**
   * Marks recent gesture as valid in main.globalGestureDecisionTree.
   * 
   * @param {boolean} match - true, if given sample is positive.
   * @returns {boolean} True, if there was a recent successful gesture.
   */
  tryMarkGesture(match) {
    if (this._recentMatchedGestureFeatures) {
      main.globalGestureDecisionTree.addTrial(
        this._recentMatchedGestureFeatures,
        this._recentMatchedGestureIndex,
        match);
      return true;
    } else {
      return false;
    }
  }

  _performMatch() {

  }

  _directionSatisfied(inputPoint, {
    angle,
    margin = 60
  }) {
    const angleDelta = (new paper.Point(1, 0))
      .rotate(angle)
      .getAngle(inputPoint);

    return angleDelta < margin;
  }


}

class GestureMatcherWithTree extends GestureMatcher {
  constructor(settings) {
    super(settings);
  }

  /**
   * Hook, which can be overridden by child classes.
   * @param {*} matchedPolynomials 
   * @param {*} residual 
   * @param {*} numberOfPoints 
   * @param {number} matchedGestureIndex
   */
  performAdditionalCheck(matchedPolynomials, residual, numberOfPoints, matchedGestureIndex) {
    const match = main.globalGestureDecisionTree.verifyGesture(this._features, matchedGestureIndex);

    if (match) {
      this.logger.log(`Decision tree ACCEPTED gesture ${matchedGestureIndex + 1}.`)
    } else {
      this.logger.log(`Decision tree REJECTED gesture ${matchedGestureIndex + 1}.`)
    }

    return match;
  }
}
