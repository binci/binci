'use strict'

const _ = require('halcyon')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const tmpdir = process.env.DEVLAB_TMP || require('os-tmpdir')()
const args = require('./args')
const config = require('./config')
const command = require('./command')
const services = require('./services')
const proc = require('./proc')
const output = require('./output')
const utils = require('./utils')

global.instanceId = require('shortid').generate()

const instance = {
  /**
   * @property {number} Timestamp of instance start
   */
  startTS: Date.now(),
  /**
   * Gets config by merging parsed arguments with config object and returns command
   * instructions for primaary instance and services.
   * @returns {object} Command instructions
   */
  getConfig: () => {
    const cfg = services.filterEnabled(_.merge(config.load(args.parse().configPath), args.parse()))
    return { services: services.get(cfg), primary: command.get(cfg, 'primary', tmpdir, true) }
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
    const svcNames = _.map(_.prop('name'), cfg.services).join(', ')
    const servicesStartSpinner = output.spinner(`Starting service${cfg.services.length > 1 ? 's' : ''} ${svcNames}`)
    return services.run(cfg.services)
      .then(() => {
        servicesStartSpinner.succeed()
        return cfg
      })
      .catch(() => {
        servicesStartSpinner.fail()
        /* istanbul ignore next */
        throw new Error(`Failed to start service${cfg.services.length > 1 ? 's' : ''}`)
      })
  },
  /**
   * Runs primary command
   * @param {object} config The instance config object
   * @returns {object} promise
   */
  runCommand: (cfg) => {
    output.success('Running Task')
    output.line()
    return proc.run(cfg.primary.args)
      .then(() => {
        output.line()
        output.success(`Command exited after ${(Date.now() - instance.startTS) / 1000}s`)
        services.stop()
        return true
      })
      .catch((code) => {
        output.line()
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
    // Write the primary command to tmp script
    return fs.writeFileAsync(`${tmpdir}/devlab.sh`, cfg.primary.cmd)
      .then(() => utils.checkOrphans())
      .then(() => instance.startServices(cfg))
      .then(instance.runCommand)
  }).catch((e) => {
    services.stop()
    output.error(e.message || 'Process failed')
    throw new Error('Process failed')
  })
}

module.exports = instance
