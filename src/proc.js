const spawn = require('child_process').spawn
const readline = require('readline')

const proc = {
  /**
   * @property {string} log
   */
  log: '',
  /**
   * Captures stdout and stderr for logs
   * @param {string} type The type of output: `out` or `err`
   * @param {string} line The line from output
   */
  capture: (type, line) => {
    const logOut = `${type.toUpperCase()}: ${line}`
    proc.log += proc.log.length === 0 ? logOut : `\n${logOut}`
  },
  /**
   * Runs a process and returns promise which reolves or rejects based on process exit
   * @param {string} cmd Command to run
   * @param {array} args Arguments to pass to command
   * @returns {object} promise
   */
  run: (args) => new Promise((resolve, reject) => {
    proc.log = '' // Reset
    const p = spawn('docker', args, {
      env: process.env,
      cwd: process.env.HOME
    })

    // Handle stdout and stderr
    const stdout = readline.createInterface({ input: p.stdout, terminal: false })
    const stderr = readline.createInterface({ input: p.stderr, terminal: false })
    stdout.on('line', (line) => proc.capture('out', line))
    stderr.on('line', (line) => proc.capture('err', line))

    // Handle close
    p.on('close', (code) => {
      code === 0 || code === 130 ? resolve() : reject(code)
    })
  })
}

module.exports = proc
