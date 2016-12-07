const min = require('minimist')
const args = require('./args')
const config = require('./config')

/* istanbul ignore next */
const processArgs = process.argv[0] === 'node' ? 1 : 2

const instance = {
  /**
   * @property {object} Arguments passed to the instance
   */
  rawArgs: min(process.argv.slice(processArgs)),
  /**
   * Gets parsed arguments object
   * @returns {object} Parsed object containing argument values
   */
  getArgs: () => args.parse(instance.rawArgs),
  /**
   * Initializes config by merging parsed arguments with config object
   * @returns {object} Full config for the instance
   */
  getConfig: () => {
    const argsObj = instance.getArgs()
    return Object.assign(config.load(argsObj.configPath || undefined), argsObj)
  }
}

module.exports = instance
