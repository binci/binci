const _ = require('redash')
const args = require('./args')
const config = require('./config')
const command = require('./command')
const services = require('./services')
const proc = require('./proc')
const output = require('./output')

global.instanceId = require('shortid').generate()

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
   * Runs primary command
   * @param {object} config The instance config object
   * @returns {object} promise
   */
  runCommand: (cfg) => {
    output.success(`Running command: ${_.last(cfg.primary)}`)
    output.line()
    return proc.run(cfg.primary)
      .then(() => {
        output.line()
        output.success(`Command exited after ${(Date.now() - instance.startTS) / 1000}s`)
        services.stop()
        return true
      })
      .catch((code) => {
        throw new Error('Command failed')
      })
  },
  /**
   * Initializes instance from config and args
   * @returns {object} promise
   */
  start: () => Promise.resolve().then(() => {
    // Get config (or throw)
    const cfg = instance.getConfig()
    // Start services, then run command
    return instance.startServices(cfg).then(instance.runCommand)
  }).catch((e) => {
    services.stop()
    output.error(e.message || 'Process failed')
    throw new Error(1)
  })
}

module.exports = instance
