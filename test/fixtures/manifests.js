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
  }
}