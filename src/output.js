const chalk = require('chalk')
const ora = require('ora')
const logSymbols = require('log-symbols')

const output = {
  /**
   * Starts a spinner
   * @param {string} m Spinner message
   */
  spinner: m => ora(m).start(),
  /**
   * Output success message
   * @param {string} m Output message
   */
  success: m => console.log(`${chalk.green(logSymbols.success)} ${m}`),
  /**
   * Output error message
   * @param {string} m Output message
   */
  error: m => console.log(`${chalk.red(logSymbols.error)} ${m}`),
  /**
   * Output line, break
   */
  line: () => console.log(chalk.gray('‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧‧'))
}

module.exports = output
