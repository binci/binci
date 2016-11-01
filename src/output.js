'use strict'
const chalk = require('chalk')

const output = {
  // Holds quiet boolean
  quiet: false,
  /**
   * Colorizes {{...}} delimited vars
   * @param {String} m Raw message
   */
  renderVars: m => m.toString()
    .replace(/\{\{([^}]+)\}\}/g, (i, match) => chalk.blue(match))
    .replace('set -e;', ''),
  /**
   * Output success message
   * @param {String} m Output message
   */
  success: m => output.log(chalk.bold.green('⦿ ') + chalk.bold(output.renderVars(m))),
  /**
   * Output warning message
   * @param {String} m Output message
   */
  warn: m => output.log(chalk.bold.yellow('⦿ ') + chalk.bold(output.renderVars(m))),
  /**
   * Output error message
   * @param {String} m Output message
   */
  error: m => output.log(chalk.bold.red('⦿ ') + chalk.bold(output.renderVars(m))),
  /**
   * Inserts break before commands are run
   */
  insertBreak: () => output.log(chalk.gray('---')),
  /**
   * Standard output
   * @param {String} m Output message
   */
  log: m => {
    /* istanbul ignore next */
    if (!output.quiet) process.stdout.write(`${m}\n`)
  }
}

module.exports = output