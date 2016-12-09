const _ = require('redash')
const min = require('minimist')
const args = require('./args')
const config = require('./config')
const command = require('./command')
const services = require('./services')
// const proc = require('./proc')
const output = require('./output')

/* istanbul ignore next */
const processArgs = process.argv[0] === 'node' ? 1 : 2

const instance = {
  /**
   * @property {number} Timestamp of instance start
   */
  startTS: Date.now(),
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
    const cfg = _.merge(config.load(argsObj.configPath || undefined), argsObj)
    // Return config object
    return cfg
  },
  /**
   * Initializes instance from config and args
   */
  start: () => {
    const cfg = instance.getConfig()
    const svc = services.get(cfg)
    const run = command.get(cfg, true)
    // Set output mode for instance
    output.quiet = cfg.quietMode
    // TEMP
    return { cfg, svc, run }
  }
}

module.exports = instance
