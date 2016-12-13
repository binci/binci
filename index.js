#!/usr/bin/env node
const devlab = require('./src/index')
devlab.start()
  .then(() => {
    process.exit(0)
  })
  .catch(() => {
    process.exit(1)
  })
