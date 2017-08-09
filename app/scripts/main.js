function downloadAsSVG() {
  main.echo('### SVG EXPORT ###');
  main.echo(paper.project.exportSVG({
    asString: true
  }));
  main.echo('##################');
}

const GestureDefinitionEditor_examples = [
  [{
      'type': 'loop',
      'inDir': {
        'angle': 0,
        'margin': 60
      },
      'outDir': {
        'angle': 90,
        'margin': 60
      }
    },
    {
      'type': 'loop',
      'inDir': {
        'angle': 0,
        'margin': 60
      },
      'outDir': {
        'angle': -90,
        'margin': 60
      }
    },
    {
      'type': 'arch',
      'inDir': {
        'angle': 180,
        'margin': 45
      },
      'outDir': {
        'angle': 90,
        'margin': 45
      },
      'numberOfFrames': [4, 20]
    }
  ]
];

class GestureDefinitionEditor {
  constructor(editorNode) {
    this._editorNode = editorNode;

    var options = {
      mode: 'code',
      schema: gestureSchema,
      templates: [{
        text: 'Gesture',
        title: 'Insert a gesture',
        value: {
          'type': 'loop',
          'inDir': {
            'angle': 0,
            'margin': 60
          },
          'outDir': {
            'angle': 90,
            'margin': 60
          }
        }
      }]
    };
    this._editor = new JSONEditor(editorNode, options);
  }

  setExample(i) {
    this._editor.set(GestureDefinitionEditor_examples[i]);
    return true;
  }

  get() {
    return this._editor.get();
  }
}

class Main {
  constructor() {
    this._logCounter = 0;
  }

  initialize() {
    this._console = document.getElementById('console');
    main.globalGestureDecisionTree = new GestureDecisionTree();

    paper.install(window);
    const mainCanvas = document.getElementById('mainCanvas');
    paper.setup(mainCanvas);

    this._setupEditor()

    const gestureCanvas = new GestureCanvas();
    this.strategyChooser = new StrategyChooser({
      selectElement: document.getElementById('strategyChooser'),
      applyButton: document.getElementById('applyButton'),
      gestureCanvas: gestureCanvas,
      strategies: [
        (args) => new NullFitStrategy(args),
        (args) => new SignaledFitStrategy(args),
        (args) => new SimpleVariableLengthFitStrategy(args),
        (args) => new SimpleDecisionTreeGestureMatcher(args)
      ],
      settingsToCollect: [
        ['frameSize', 'frameSize'],
        ['gestureSpan', 'gestureSpan'],
        [() => this.editor.get(), 'gestureDefinitions']
      ]
    });

    document.addEventListener('keydown', (event) => {
      if (event.altKey) {
        switch (event.code) {
          case 'KeyP':
            gestureCanvas.paused = !gestureCanvas.paused;
            if (gestureCanvas.paused) {
              this.log('Paused!')
            }
            break;
          case 'KeyE':
            downloadAsSVG();
            break;
          case 'KeyC':
            this.clearConsole();
            break;
          default:
        }
      };

      this.strategyChooser.onKeyDown(event);


    });
  }

  echo(message) {
    var node = document.createElement('p');
    node.appendChild(document.createTextNode(message));
    this._console.appendChild(node);
    this._console.scrollTop = this._console.scrollHeight;
  }

  error(message) {
    var node = document.createElement('p');
    node.classList.add('error');
    node.appendChild(document.createTextNode(message));
    this._console.appendChild(node);
    this._console.scrollTop = this._console.scrollHeight;
  }

  log(message) {
    this.echo(`[${++this._logCounter}]: ${message}`);
  }

  exportLearnedSamples() {
    return JSON.stringify(main.globalGestureDecisionTree.exportSamples());
  }

  importLearnedSamples(samples, resetCurrent = true) {
    main.globalGestureDecisionTree.importSamples(JSON.parse(samples), resetCurrent);
  }

  clearConsole() {
    var node = this._console;
    while (node.hasChildNodes()) {
      node.removeChild(node.lastChild);
    }
  }

  _setupEditor() {
    var container = document.getElementById('gestureDefinitions');
    this.editor = new GestureDefinitionEditor(container);
    this.editor.setExample(0);
  }
}

const main = new Main();

window.onload = function () {
  main.initialize();
}
