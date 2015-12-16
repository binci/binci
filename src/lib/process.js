/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import { spawn } from 'child_process'
import Promise from 'bluebird'
import output from './output'

// Test output supression
const stdio = output.setStdio()

/**
 * Spawns a process and returns a promise for handling results
 * @param {String} proc The command/process to run
 * @param {Array} args The arguments of the proc command
 */
export const spawnProc = (proc, args) => {
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
