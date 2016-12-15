const instance = {
  exec: {
    services: [
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
      }
    ],
    primary: [
      'run',
      '--rm',
      '-it',
      '-v',
      '/tmp:/tmp',
      '-w',
      '/tmp',
      '--privileged',
      '-p',
      '8080:8080',
      '--link',
      'dl_mongodb_test:mongodb',
      '--name',
      'dl_primary_test',
      'node:6',
      'sh',
      '-c',
      'echo "foo"'
    ]
  },
  task: {
    services: [
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
      }
    ],
    primary: [
      'run',
      '--rm',
      '-it',
      '-v',
      '/tmp:/tmp',
      '-w',
      '/tmp',
      '--privileged',
      '-p',
      '8080:8080',
      '--link',
      'dl_mongodb_test:mongodb',
      '--name',
      'dl_primary_test',
      'node:6',
      'sh',
      '-c',
      'env | sort'
    ]
  }
}

module.exports = instance
