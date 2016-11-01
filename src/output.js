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
  success: m => {
    if (!output.quiet) output.log(chalk.bold.green('⦿ ') + chalk.bold(output.renderVars(m)))
  },
  /**
   * Output warning message
   * @param {String} m Output message
   */
  warn: m => {
    if (!output.quiet)output.log(chalk.bold.yellow('⦿ ') + chalk.bold(output.renderVars(m)))
  },
  /**
   * Output error message
   * @param {String} m Output message
   */
  error: m => {
    if (!output.quiet) output.log(chalk.bold.red('⦿ ') + chalk.bold(output.renderVars(m)))
  },
  /**
   * Inserts break before commands are run
   */
  insertBreak: () => {
    if (!output.quiet) output.log(chalk.gray('---'))
  },
  /**
   * Determine stdio fro process
   */
  setStdio: () => {
    return !process.env.LAM_TEST ? [ 'inherit', process.stdout, process.stdout ] : [ null, null, null ]
  },
  /**
   * Standard log output, no formatting
   * @param {String} m Output message
   */
  log: m => {
    if (!process.env.LAM_TEST) process.stdout.write(`${m}\n`)
  }
}

module.exports = output