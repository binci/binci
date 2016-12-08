const spawn = require('child_process').spawn

const proc = {
  /**
   * Runs a process and returns promise which reolves or rejects based on process exit
   * @param {string} cmd Command to run
   * @param {array} args Arguments to pass to command
   * @param {boolean} silent Run without stdout/stderr, default = false
   * @returns {object} promise
   */
  run: (cmd, args, silent = false) => new Promise((resolve, reject) => {
    const p = spawn(cmd, args)
    p.on('close', (code) => {
      code === 0 ? resolve() : reject()
    })
  })
}

module.exports = proc
