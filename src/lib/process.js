/*
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict'
const spawn = require('child_process').spawn
const Promise = require('bluebird')
const output = require('./output')

// Test output supression
const stdio = output.setStdio()

/**
 * Spawns a process and returns a promise for handling results
 * @param {String} proc The command/process to run
 * @param {Array} args The arguments of the proc command
 */
const spawnProc = (proc, args) => {
  output.insertBreak()
  return new Promise((resolve, reject) => {
    const p = spawn(proc, args, {
      env: process.env,
      cwd: process.env.HOME,
      stdio
    })
    // Handle close
    p.on('close', code => {
      output.insertBreak()
      if (code === 0 || code === 130) return resolve()
      reject(code)
    })
  })
}

module.exports = spawnProc
