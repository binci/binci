module.exports = [
  {
    name: 'mongodb',
    stopTimeSecs: 10,
    args: [
      'run',
      '-d',
      '--privileged',
      '-p',
      '27017:27017',
      '--name',
      'bc_mongodb_test',
      'mongo:3.0'
    ]
  }, {
    name: 'redis',
    args: [
      'run',
      '-d',
      '--privileged',
      '--name',
      'bc_redis_test',
      'redis'
    ]
  }
]
