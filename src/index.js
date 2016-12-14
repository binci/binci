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
   * Starts services and resolves or rejects
   * @param {object} cfg Instance config object
   * @returns {object} promise
   */
  startServices: (cfg) => {
    // No services, resolve
    if (!cfg.services.length) return Promise.resolve(cfg)
    // Start services
    const svcNames = cfg.services.reduce((acc, svc) => acc.concat([ svc.name ]), []).join(', ')
    const servicesStartSpinner = output.spinner(`Starting service${cfg.services.length > 1 ? 's' : ''} ${svcNames}`)
    return services.run(cfg.services)
      .then(() => {
        servicesStartSpinner.succeed()
        return cfg
      })
      .catch(() => {
        servicesStartSpinner.fail()
        throw new Error('Failed to start services')
      })
  },
  /**
   * Stops services and resolves or rejects
   * @returns {object} promise
   */
  stopServices: () => {
    if (!services.running.length) return Promise.resolve()
    const servicesStopSpinner = output.spinner('Stopping services')
    return services.stop()
      .then(() => {
        servicesStopSpinner.succeed()
        return true
      })
      .catch(() => {
        servicesStopSpinner.fail()
        throw new Error('Failed to stop all services')
      })
  },
  /**
   * Initializes instance from config and args
   */
  start: () => instance.startServices(instance.getConfig())
    .then((cfg) => {
      output.success(`Running command ${_.last(cfg.primary)}`)
      return proc.run(cfg.primary)
    })
    .then(instance.stopServices)
    .catch((e) => {
      console.log('e', e)
      return instance.stopServices()
    })
}

module.exports = instance
