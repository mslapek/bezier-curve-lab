/**
 * Decision tree per gesture.
 */
class GestureDecisionTree {
  constructor() {
    this.logger = new ConsoleLogger();
    this._featuresUnderConsideration = ['type', 'averageResidual', 'frameNumber', 'length', 'angleIn', 'angleOut', 'proportionInsideLoop'];
    this._featuresInGestureDefinition = ['type', 'averageResidual', 'numberOfFrames', 'length', 'inDir', 'outDir', 'proportionInsideLoop']; 
    this._featureTypes = ['category', 'number', 'number', 'number', 'number', 'number', 'number'];
    this._lastGestureBase = null;
  }

  /**
   * Add new sample to training set.
   * 
   * @param {object} extractedFeatures - Result from method extractFeatures.
   * @param {integer} gestureIndex - Index (from 0) of current gesture.
   * @param {boolean} match - true, if given sample is positive.
   */
  addTrial(extractedFeatures, gestureIndex, match) {
      const { features, samples } = this._gestureTrees[gestureIndex];
      const newSample = FeatureExtractor.extractAsRow(extractedFeatures, features, match);

      samples.push(newSample);

      this.logger.log(`Added new sample to gesture ${gestureIndex + 1} with match=${match}.`);
  }

  /**
   * Performs prediction with trained tree.
   * 
   * @param {object} extractedFeatures - Result from method extractFeatures.
   * @param {integer} gestureIndex - Index (from 0) of current gesture.
   * @returns {boolean}  Whether there is a match.
   */
  verifyGesture(extractedFeatures, gestureIndex) {
    const { features, model } = this._gestureTrees[gestureIndex];

    if(model == null) {
        const msg = 'Used GestureDecisionTree without prior retrainModels.';
        main.error(msg);
        throw msg;
    }

    //const currentSample = FeatureExtractor.extractAsRow(extractedFeatures, features, null);
    const currentSample = extractedFeatures;

    const classification = model.classify(currentSample);

    if(classification == 'none data') {
        this.logger.log('Accepted untrained gesture.');
        return true;
    }

    return (classification == true);
  }

  /**
   * Applies new samples to models.
   */
  retrainModels() {
    var c45 = C45();
    for (var gestureIndex = 0; gestureIndex < this._gestureTrees.length; gestureIndex++) {
        const gestureTree = this._gestureTrees[gestureIndex];
        
        c45.train({
            data: gestureTree.samples,
            target: 'matchesClass',
            features: gestureTree.features,
            featureTypes: gestureTree.featureTypes
        }, (error, model) => {
            if(error) {
                main.error(error);
                throw error;
            }

            gestureTree.model = model;
        });
    }

    this.logger.log('Retrained decision trees.')

    for (var gestureIndex = 0; gestureIndex < this._gestureTrees.length; gestureIndex++) {
        const { 'model': { model } } = this._gestureTrees[gestureIndex];
        this.logger.log(`Gesture ${gestureIndex + 1} tree:`);
        main.echo(JSON.stringify(model, undefined, 2));
    }
  }

  /**
   * Updates gesture base if outdated.
   * @param {*} gestures - Gesture base (as in editor).
   */
  verifyGestureBase(gestures) {
    if(JSON.stringify(this._lastGestureBase) !== JSON.stringify(gestures)) {
        this.logger.log('Updating gesture base in gesture decision tree.');
        this._lastGestureBase = gestures;
        this._configureGestures(gestures);
    }
  }

  /**
   * Resets samples and model.
   */
  resetSamples() {
      this._configureGestures(this._lastGestureBase);
  }

  _configureGestures(gestures) {
    this._gestureTrees = [];
    for (var gestureIndex = 0; gestureIndex < gestures.length; gestureIndex++) {
        const gesture = gestures[gestureIndex];
        const features = [];
        const featureTypes = [];

        for (var featureIndex = 0; featureIndex < this._featuresUnderConsideration.length; featureIndex++) {
            const inGestureDefinition = this._featuresInGestureDefinition[featureIndex];
            const featureUnderConsideration = this._featuresUnderConsideration[featureIndex];
            const featureType = this._featureTypes[featureIndex];

            if(!gesture[inGestureDefinition]) {
                features.push(featureUnderConsideration);
                featureTypes.push(featureType);
            }
        }

        this._gestureTrees[gestureIndex] = {
            'features': features,
            'featureTypes': featureTypes,
            'samples': [],
            'model': null
        };
    }
  }

  exportSamples() {
      var result = [];
      for (var gestureIndex = 0; gestureIndex < this._gestureTrees.length; gestureIndex++) {
          var { samples } = this._gestureTrees[gestureIndex];
          result[gestureIndex] = samples;
      }

      return result;
  }

  importSamples(samples, resetCurrent = true) {
    for (var gestureIndex = 0; gestureIndex < this._gestureTrees.length; gestureIndex++) {
          var { 'samples': gestureSamples } = this._gestureTrees[gestureIndex];
          if(resetCurrent) {
              gestureSamples.length = 0;
          }
          samples[gestureIndex].forEach((element) => {
              gestureSamples.push(element)
          });
      }
  }
}
