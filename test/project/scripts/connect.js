const redis = require('redis')
const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST)

client.on('error', () => {
  console.log('ERROR')
  process.exit(1)
})
client.set('key', 'value', () => {
  console.log('\nKEY SET')
  process.exit(0)
})
