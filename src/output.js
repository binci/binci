'use strict'

const chalk = require('chalk')
const ora = require('ora')
const logSymbols = require('log-symbols')

const output = {
  /**
   * Starts a spinner and returns object
   * @param {string} m Spinner message
   * @returns {object} Spinner instance
   */
  spinner: (m) => ora(m).start(),
  /**
   * Outputs success message
   * @param {string} m Output message
   */
  success: (m) => console.log(`${chalk.green(logSymbols.success)} ${m}`),
  /**
   * Outputs error message
   * @param {string} m Output message
   */
  error: (m) => console.log(`${chalk.red(logSymbols.error)} ${m}`),
  /**
   * Output info message
   * @param {string} m Output message
   */
  info: (m) => console.log(`${chalk.blue(logSymbols.info)} ${m}`),
  /**
   * Output warning message
   * @param {string} m Output message
   */
  warn: (m) => console.log(`${chalk.yellow(logSymbols.warning)} ${m}`),
  /**
   * Output line, break
   */
  line: () => console.log(chalk.gray('‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧'))
}

module.exports = output
