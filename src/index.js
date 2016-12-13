const _ = require('redash')
const args = require('./args')
const config = require('./config')
const command = require('./command')
const services = require('./services')
const proc = require('./proc')
const output = require('./output')

const instance = {
  /**
   * @property {number} Timestamp of instance start
   */
  startTS: Date.now(),
  /**
   * Gets config by merging parsed arguments with config object and returns command
   * instructions for instance
   * @returns {object} Command instructions
   */
  getConfig: () => {
    const cfg = _.merge(config.load(args.parse().configPath), args.parse())
    return { services: services.get(cfg), primary: command.get(cfg, 'primary', true) }
  },
  /**
   * Initializes instance from config and args
   */
  start: () => {
    const cfg = instance.getConfig()
    const svcNames = cfg.services.reduce((acc, svc) => acc.concat([ svc.name ]), []).join(', ')
    if (svcNames.length) output.log(`Starting service${cfg.services.length > 1 ? 's': ''} ${svcNames}`)
    return services.run(cfg.services)
      .then(() => {
        output.success(`Starting command ${_.last(cfg.primary)}`)
        return proc.run(cfg.primary)
      })
      .then(() => services.stop())
      .then(() => {
        console.log(`Completed in ${(Date.now() - instance.startTS) / 1000} seconds`)
      })
      .catch((e) => {
        services.stop()
        console.log('ERR', e)
      })
  }
}

module.exports = instance
