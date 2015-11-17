export default {
  // Simple task
  simple: {
    tasks: {
      foo: 'bar'
    }
  },
  // Simple before
  simpleBefore: {
    'before-task': 'baz',
    tasks: {
      foo: 'bar'
    }
  },
  // Simple Before and After
  simpleBeforeAfter: {
    'before-task': 'baz',
    'after-task': 'quz',
    tasks: {
      foo: 'bar'
    }
  },
  // Multi-line Before
  multiLnBefore: {
    'before-task': 'fizz\nbuzz',
    tasks: {
      foo: 'bar'
    }
  },
  // Multi-line Before and After
  multiLnBeforeAfter: {
    'before-task': 'fizz\nbuzz',
    'after-task': 'lor\nips',
    tasks: {
      foo: 'bar'
    }
  },
  // Simple alias
  simpleAlias: {
    tasks: {
      foo: 'bar',
      baz: '.foo'
    }
  },
  // Multi-Alias
  multiAlias: {
    tasks: {
      foo: 'bar',
      baz: 'quz',
      lor: 'ips',
      fiz: '.foo .baz .lor'
    }
  },
  // Complex multi-alias
  complexMultiAlias: {
    'before-task': 'fizz\nbuzz',
    'after-task': 'lor\nips',
    tasks: {
      foo: 'bar',
      baz: 'quz',
      lor: 'ips',
      fiz: '.foo .baz .lor'
    }
  },
  // Multi-expose
  multiExpose: {
    services: {
      'ryanratcliff/dynamodb': {
        expose: ['7000:8000']
      },
      'mysql': {
        expose: ['3306:3306']
      },
      'mongo': {
        expose: ['27017:27017'],
        forward: false
      }
    },
    expose: ['8181:8181', '8282:8282']
  }
}