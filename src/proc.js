const spawn = require('child_process').spawn
const readline = require('readline')

const proc = {
  /**
   * Runs a process and returns promise which reolves or rejects based on process exit
   * @param {string} cmd Command to run
   * @param {array} args Arguments to pass to command
   * @param {boolean} silent Silences output
   * @returns {object} promise
   */
  run: (args, silent = false) => new Promise((resolve, reject) => {
    const opts = { env: process.env, cwd: process.env.HOME }
    opts.stdio = silent ? [ null, null, null ] : [ 'inherit', process.stdout, process.stdout ]
    // Start
    const p = spawn('docker', args, opts)
    // Handle close
    p.on('close', (code) => {
      code === 0 || code === 130 ? resolve() : reject(code)
    })
  })
}

module.exports = proc
