const gestureSchema = {
  /* "$schema": "http://json-schema.org/draft-04/schema#", */
  'definitions': {},
  'id': 'http://example.com/example.json',
  'items': {
    'additionalProperties': false,
    'id': '/items',
    'properties': {
      'averageResidual': {
        'id': '/items/properties/averageResidual',
        'type': 'integer'
      },
      'inDir': {
        'additionalProperties': false,
        'id': '/items/properties/inDir',
        'properties': {
          'angle': {
            'id': '/items/properties/inDir/properties/angle',
            'type': 'integer'
          },
          'margin': {
            'id': '/items/properties/inDir/properties/margin',
            'type': 'number'
          }
        },
        'required': [
          'angle'
        ],
        'type': 'object'
      },
      'numberOfFrames': {
        'additionalItems': false,
        'id': '/items/properties/numberOfFrames',
        'items': {
          'id': '/items/properties/numberOfFrames/items',
          'type': 'integer'
        },
        'maxItems': 2,
        'minItems': 2,
        'type': 'array'
      },
      'length': {
        'additionalItems': false,
        'id': '/items/properties/length',
        'items': {
          'id': '/items/properties/length/items',
          'type': 'integer'
        },
        'maxItems': 2,
        'minItems': 2,
        'type': 'array'
      },
      'outDir': {
        'additionalProperties': false,
        'id': '/items/properties/outDir',
        'properties': {
          'angle': {
            'id': '/items/properties/outDir/properties/angle',
            'type': 'integer'
          },
          'margin': {
            'id': '/items/properties/outDir/properties/margin',
            'type': 'integer'
          }
        },
        'required': [
          'angle'
        ],
        'type': 'object'
      },
      'type': {
        'id': '/items/properties/type',
        'type': 'string',
        'enum': [
          'loop',
          'arch',
          'cusp',
          'serpentine'
        ]
      }
    },
    'type': 'object'
  },
  'type': 'array'
};
