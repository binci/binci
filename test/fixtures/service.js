module.exports = [{
  name: 'mongodb',
  args: [
    'run',
    '--rm',
    '-d',
    '--privileged',
    '-p',
    '27017:27017',
    '--name',
    'dl_mongodb',
    'mongo:3.0'
  ]
}]
