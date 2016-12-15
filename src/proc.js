const cp = require('child_process')
const Promise = require('bluebird')

const proc = {
  /**
   * Runs a process and returns promise which reolves or rejects based on process exit
   * @param {array} args Arguments to pass to command
   * @param {boolean} silent Silences output, used primarily for services
   * @returns {object} promise
   */
  run: (args, silent = false) => new Promise((resolve, reject) => {
    const opts = { env: process.env, cwd: process.env.HOME }
    opts.stdio = silent ? [ null, null, null ] : [ 'inherit', process.stdout, process.stdout ]
    // Start
    const p = cp.spawn('docker', args, opts)
    // Handle close
    p.on('close', (code) => {
      code === 0 || code === 130 ? resolve() : reject(code)
    })
  }),
  /**
   * Creates a detached process for shutting down services
   * @param {string} cmd Command to execute
   */
  runDetached: (cmd) => {
    const p = cp.spawn('sh', [ '-c', cmd ], {
      detached: true,
      stdio: 'ignore'
    })
    p.unref()
  },
  /**
   * @property {function} Node child_process.exec, promisified
   */
  exec: Promise.promisify(cp.exec)
}

module.exports = proc
