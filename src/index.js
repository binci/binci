const _ = require('redash')
const args = require('./args')
const config = require('./config')
const command = require('./command')
const services = require('./services')
const proc = require('./proc')
// const output = require('./output')

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
  start: () => Promise.resolve().then(() => {
    // let servicesSpinner
    const cfg = instance.getConfig()
    // const svcNames = cfg.services.reduce((acc, svc) => acc.concat([ svc.name ]), []).join(', ')
    // if (svcNames.length) {
    //   servicesSpinner = output.spinner(`Starting service${cfg.services.length > 1 ? 's' : ''} ${svcNames}`)
    // }
    return services.run(cfg.services)
      .then(() => {
        console.log('services started')
        return proc.run(cfg.primary)
      })
      .then(() => {
        console.log('stopping services')
        return services.stop()
      })
      .catch((e) => {
        console.log('e', e)
        return services.stop()
      })
      // .then(() => {
      //   servicesSpinner.succeed()
      //   console.log('PRIMARY', cfg.primary)
      //   output.success(`Starting command ${_.last(cfg.primary)}`)
      //   return proc.run(cfg.primary)
      // })
      // .then(() => {
      //   output.success(`Completed in ${(Date.now() - instance.startTS) / 1000} seconds`)
      // })
  })
  // .then(() => {
  //   return services.stop()
  // })
  // .catch((e) => {
  //   services.stop()
  //   output.error(e.message || 'Process failed')
  // })
}

module.exports = instance
