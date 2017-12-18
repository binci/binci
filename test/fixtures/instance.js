const instance = {
  exec: {
    services: [
      {
        name: 'mongodb',
        persist: false,
        stopTimeSecs: 10,
        args: [
          'run',
          '-d',
          '--privileged',
          '--rm',
          '-p',
          '27017:27017',
          '--name',
          'bc_mongodb_test',
          'mongo:3.0'
        ]
      }
    ],
    primary: {
      args: [
        'run',
        '--rm',
        '-v',
        '/tmp:/tmp',
        '-v',
        '/tmp:/tmp',
        '-w',
        '/tmp',
        '--privileged',
        '-it',
        '-p',
        '8080:8080',
        '--link',
        'bc_mongodb_test:mongodb',
        '--name',
        'bc_primary_test',
        'node:6',
        'sh',
        '/tmp/binci.sh'
      ],
      cmd: '#!/bin/sh\nset -e;\necho "foo"'
    }
  },
  task: {
    services: [
      {
        name: 'mongodb',
        persist: false,
        stopTimeSecs: 10,
        args: [
          'run',
          '-d',
          '--privileged',
          '--rm',
          '-p',
          '27017:27017',
          '--name',
          'bc_mongodb_test',
          'mongo:3.0'
        ]
      }
    ],
    primary: {
      args: [
        'run',
        '--rm',
        '-v',
        '/tmp:/tmp',
        '-v',
        '/tmp:/tmp',
        '-w',
        '/tmp',
        '--privileged',
        '-it',
        '-p',
        '8080:8080',
        '--link',
        'bc_mongodb_test:mongodb',
        '--name',
        'bc_primary_test',
        'node:6',
        'sh',
        '/tmp/binci.sh'
      ],
      cmd: '#!/bin/sh\nset -e;\nenv | sort'
    }
  }
}

module.exports = instance
