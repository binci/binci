'use strict'
/* eslint no-unused-vars: 0 */
/**
 * #######################################################################
 * CUSTOM END-TO-END SYSTEM TEST RUNNER
 * #######################################################################
 * This script will run all tests in `./tests.json` and report back their
 * output and pass/fail status
 */
let tests
const _ = require('redash')
const path = require('path')
const Promise = require('bluebird')
// Test project
const testProject = path.resolve(__dirname, '../project')
// Devlab executable file
const executable = path.resolve(__dirname, '../../index.js')

// Runs proc
const spawn = (args) => new Promise((resolve, reject) => {
  const p = require('child_process').spawn('node', [ executable, ...args ], {
    env: process.env,
    cwd: testProject,
    stdio: [ 'inherit', process.stdout, process.stdout ]
  })
  p.on('close', (code) => {
    code === 0 || code === 130 ? resolve() : reject(code)
  })
})

/**
 * Runner
 */
const runner = (() => {
  // Ensure valid JSON test file
  try {
    // Test definitions
    tests = require('./tests.json')
  } catch (e) {
    console.log('Invalid tests.json file')
    process.exit(1)
  }
  let testFails = 0
  Promise.mapSeries(_.keys(tests), (name) => {
    const testObj = tests[name]
    console.log('\n\n#----------------------------------------------')
    console.log(`# ${name}: ${testObj.description}`)
    console.log(`# devlab ${testObj.args.join(' ')}`)
    console.log('#----------------------------------------------\n\n')
    return spawn(testObj.args).catch((c) => {
      if (testObj.should === 'pass') testFails++
    })
  }).then(() => {
    // Results
    console.log('\n\n#----------------------------------------------')
    console.log(`# TEST RESULTS: ${testFails} failures`)
    console.log('#----------------------------------------------\n\n')
    // Exit code
    if (testFails > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }
  })
})()
