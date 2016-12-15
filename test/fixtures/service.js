module.exports = [
  {
    name: 'mongodb',
    args: [
      'run',
      '-d',
      '--privileged',
      '-p',
      '27017:27017',
      '--name',
      'dl_mongodb_test',
      'mongo:3.0'
    ]
  }, {
    name: 'redis',
    args: [
      'run',
      '-d',
      '--privileged',
      '--name',
      'dl_redis_test',
      'redis'
    ]
  }
]
