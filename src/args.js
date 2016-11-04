'use strict'
const _ = require('lodash')

const pkg = require('../package.json')
const output = require('./output')

const args = {
  /**
   * @property {object} available run-time flags
   * - @property {string} action - the method to call to parse flag
   * - @property {string} help - the help text to display to the user
   */
  available: {
    h: { action: 'showHelp', help: 'Displays help and usage' },
    v: { action: 'showVersion', help: 'Displays the current installed version' },
    e: { action: 'setExecCommand', help: 'Run a custom command instead of defined task' },
    f: { action: 'setPrimaryFrom', help: 'Run with specified docker image' },
    c: { action: 'setCustomConf', help: 'Run with custom config file path' },
    q: { action: 'setQuietMode', help: 'Run in quiet-mode, execution only output' }
  },
  /**
   * Displays the help and usage message
   */
  showHelp: () => {
    let help = ''
    help += `  ${pkg.name} v.${pkg.version}\n`
    help += `  Usage: [${Object.keys(pkg.bin).join('|')}] task [options]\n`
    help += Object.keys(args.available).reduce((p, c) => `${p}\n    -${c}  ${args.available[c].help}`, '')
    output.log(help)
    process.exit(0)
  },
  /**
   * Displays the current version
   */
  showVersion: () => {
    output.log(pkg.version)
    process.exit(0)
  },
  /**
   * Sets the execution task
   * @param {string} e the exec command
   * @returns {object}
   */
  setExecCommand: (e) => new Object({ exec: e }),
  /**
   * Sets the primary container source (FROM)
   * @param {string} f the container specification
   * @returns {object}
   */
  setPrimaryFrom: (f) => new Object({ from: f }),
  /**
   * Sets custom config path
   * @param {string} c the path to the config file
   * @returns {object}
   */
  setCustomConf: (c) => new Object({ configPath: c }),
  /**
   * Sets quiteMode boolean
   * @param {boolean} q whether or not quiet mode was passed
   * @returns {object}
   */
  setQuietMode: (q) => new Object({ quietMode: true }),
  /**
   * Parse arguments
   * @param {object} argObj arguments from invocation
   * @returns {object}
   */
  parse: (argObj) => {
    const argsOut = {}
    Object.keys(argObj).forEach((arg) => {
      if (args.available[arg]) _.assign(argsOut, args[args.available[arg].action].apply(null, [ argObj[arg] ]))
    })
    // Set task from _
    argsOut.task = argObj._.join(' ')
    return argsOut
  }
}

module.exports = args
