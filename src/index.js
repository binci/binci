const min = require('minimist')
const args = require('./args')
const config = require('./config')
const command = require('./command')
// const proc = require('./proc')
const output = require('./output')

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
   * Gets config by merging parsed arguments with config object
   * @returns {object} Full config for the instance
   */
  getConfig: () => {
    const argsObj = instance.getArgs()
    const cfg = Object.assign(config.load(argsObj.configPath || undefined), argsObj)
    // Set output mode for instance
    output.quiet = cfg.quietMode
    // Return config object
    return cfg
  },
  /**
   * Gets all services and returns name and arguments
   * @param {array} cfg Instance config object
   * @returns {array}
   */
  getServices: (cfg) => {
    return !cfg.services ? false : cfg.services.reduce((acc, item) => {
      acc.push({ name: Object.keys(item)[0], args: command.getArgs(item[Object.keys(item)[0]]) })
      return acc
    }, [])
  },
  /**
   * Initializes instance from config and args
   */
  start: () => {
    const cfg = instance.getConfig()
    // TEMP
    return cfg
  }
}

module.exports = instance
