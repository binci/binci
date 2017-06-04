#!/usr/bin/env node
const binci = require('./src/index')
binci.start().then(() => {
  process.exit(0)
}).catch(() => {
  process.exit(1)
})
