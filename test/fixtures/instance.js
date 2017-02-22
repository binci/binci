const instance = {
  exec: {
    services: [
      {
        name: 'mongodb',
        persist: false,
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
    primary: {
      args: [
        'run',
        '--rm',
        '-it',
        '-v',
        '/tmp:/tmp',
        '-v',
        '/tmp/devlab.sh:/devlabExec',
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
        '/devlabExec'
      ],
      cmd: '#!/bin/sh\nset -e;\necho "foo"'
    }
  },
  task: {
    services: [
      {
        name: 'mongodb',
        persist: false,
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
    primary: {
      args: [
        'run',
        '--rm',
        '-it',
        '-v',
        '/tmp:/tmp',
        '-v',
        '/tmp/devlab.sh:/devlabExec',
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
        '/devlabExec'
      ],
      cmd: '#!/bin/sh\nset -e;\nenv | sort'
    }
  }
}

module.exports = instance
