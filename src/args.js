'use strict'
const pkg = require('../package.json')
const output = require('./output')

const args = {
  /**
   * @property {object} Available run-time flags
   * - @property {string} action - the method to call when parsing
   * - @property {string} prop - the prop to set when parsing
   * - @property {string} help - the help text to display to the user
   */
  available: {
    h: { action: 'showHelp', help: 'Displays help and usage' },
    v: { action: 'showVersion', help: 'Displays the current installed version' },
    e: { prop: 'exec', help: 'Run a custom command instead of defined task' },
    f: { prop: 'from', help: 'Run with specified docker image' },
    c: { prop: 'configPath', help: 'Run with custom config file path' },
    q: { prop: 'quietMode', help: 'Run in quiet-mode, execution only output' }
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
   * Parse arguments
   * @param {object} argObj Arguments from invocation
   * @returns {object}
   */
  parse: (argObj) => {
    const argsOut = argObj._ ? { task: argObj._.join(' ') } : {}
    Object.keys(argObj).forEach((arg) => {
      if (args.available[arg] && args.available[arg].prop) {
        argsOut[args.available[arg].prop] = argObj[arg]
      } else if (args.available[arg] && args.available[arg].action) {
        args[args.available[arg].action].apply(null, [ argObj[arg] ])
      }
    })
    return argsOut
  }
}

module.exports = args
