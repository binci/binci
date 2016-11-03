'use strict'
const _ = require('lodash')

const pkg = require('../package.json')
const output = require('./output')

const args = {
  /**
   * @property {object} available run-time flags
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
   */
  setExecCommand: (e) => new Object({ exec: e }),
  /**
   * Sets the primary container source (FROM)
   */
  setPrimaryFrom: (f) => new Object({ from: f }),
  /**
   * Sets custom config path
   */
  setCustomConf: (c) => new Object({ configPath: c }),
  /**
   * Sets quiteMode boolean
   */
  setQuietMode: (q) => new Object({ quietMode: true }),
  /**
   * Parse arguments
   * @param {object} argObj Arguments
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
