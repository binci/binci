const _ = require('redash')
const args = require('./args')
const config = require('./config')
// const command = require('./command')
const services = require('./services')
// const proc = require('./proc')
// const output = require('./output')

const instance = {
  /**
   * @property {number} Timestamp of instance start
   */
  startTS: Date.now(),
  /**
   * Gets config by merging parsed arguments with config object
   * @returns {object} Full config for the instance
   */
  getConfig: () => {
    const cfg = _.merge(config.load(args.parse().configPath), args.parse())
    const svc = services.get(cfg)
    cfg.services = svc
    return cfg
  },
  /**
   * Initializes instance from config and args
   */
  start: () => {
    const cfg = instance.getConfig()
    return cfg
  }
}

module.exports = instance
