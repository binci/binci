'use strict'
const pkg = require('../package.json')
const output = require('./output')

const args = {
  /**
   * @property {object} available run-time flags
   */
  available: {
    h: { action: 'showHelp', help: 'Displays help and usage' },
    v: { action: 'showVersion', help: 'Displays the current installed version' },
    e: { action: 'execCommand', help: 'Run a custom command instead of defined task' },
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
  }
}

module.exports = args
