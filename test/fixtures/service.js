module.exports = [{
  name: 'mongodb',
  args: [
    'run',
    '-d',
    '--privileged',
    '-p',
    '27017:27017',
    '--name',
    'dl_mongodb',
    'mongo:3.0'
  ]
}]
