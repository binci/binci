'use strict'

const _ = require('halcyon')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const updateNotifier = require('update-notifier')

const args = require('./args')
const config = require('./config')
const command = require('./command')
const services = require('./services')
const proc = require('./proc')
const pkg = require('../package.json')
const output = require('./output')
const utils = require('./utils')
const images = require('./images')

const tmpdir = require('./tempdir')()

global.instanceId = require('shortid').generate()

const instance = {
  checkForUpdates: () => {
    const notifier = updateNotifier({ pkg })
    /* istanbul ignore else: don't need to test that it wasn't called */
    if (notifier.update) output.warn(`Update available: ${notifier.update.latest}`)
  },
  /**
   * @property {number} Timestamp of instance start
   */
  startTS: Date.now(),
  /**
   * Gets the project config by loading the config file and merging it with applicable command line
   * arguments.
   * @returns {Promise.<Object>} an object representing the Binci config for this project
   */
  getProjectConfig: () => {
    return Promise.resolve()
      .then(args.parse)
      .then(parsedArgs => {
        const initConfig = config.load(parsedArgs.configPath)
        return services.filterEnabled(_.merge(initConfig, parsedArgs))
      })
  },
  /**
   * Gets the runtime configuration by adapting the project config into an object that describes
   * only the things applicable to the current binci execution.
   * @param {Object} projConfig A project config object
   * @param {boolean} [rmOnShutdown=false] true to delete the main container automatically when stopped
   * @returns {object} Command instructions
   */
  getRunConfig: (projConfig, rmOnShutdown) => ({
    services: services.get(projConfig),
    primary: command.get(_.merge(projConfig, { rmOnShutdown }), 'primary', tmpdir, true)
  }),
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
      .catch((e) => {
        servicesStartSpinner.fail()
        const failed = e.svcs
        /* istanbul ignore next */
        throw new Error(`Failed to start service${failed.length > 1 ? 's' : ''}: ${failed.join(', ')}`)
      })
  },
  /**
   * Stops services and resolves or rejects
   * @returns {object} promise
   */
  stopServices: (cfg) => {
    if (!services.running.length) return Promise.resolve()
    const servicesStopSpinner = output.spinner('Stopping services')
    return services.stop(cfg)
      .then(() => servicesStopSpinner.succeed())
      .catch((err) => {
        servicesStopSpinner.fail()
        output.error(`The following services failed to exit: ${err.svcs.join(', ')}`)
      })
  },
  /**
   * Runs primary command
   * @param {object} cfg The instance config object
   * @returns {object} promise
   */
  runCommand: (cfg) => {
    output.success('Running Task')
    output.line()
    return proc.run(cfg.primary.args)
      .then(() => {
        output.line()
        output.success(`Command exited after ${(Date.now() - instance.startTS) / 1000}s`)
        return true
      })
      .catch((code) => {
        output.line()
        throw new Error('Command failed')
      })
  },
  /**
   * Checks to see if the provided config has a `from` field. If not, the docker
   * image will be built (if it hasn't already) and the resulting image ID will be
   * saved back to the config object as `from`.
   * @param {Object} cfg The instance config object
   * @returns {Promise.<Object>} The modified config object
   */
  attachFrom: (cfg) => {
    if (!cfg.from) {
      return images.getImage(cfg.dockerfile)
        .then(imageId => {
          cfg.from = imageId
          return cfg
        })
    }
    return Promise.resolve(cfg)
  },
  /**
   * Initializes instance from config and args
   * @returns {object} promise
   */
  start: () => Promise.resolve()
    .then(instance.checkForUpdates)
    .then(utils.checkVersion)
    .then(instance.getProjectConfig)
    .then(cfg => instance.attachFrom(cfg))
    .then(cfg => instance.getRunConfig(cfg))
    .then(cfg => {
      // Write the primary command to tmp script
      return fs.writeFileAsync(`${tmpdir}/binci.sh`, cfg.primary.cmd)
        .then(() => utils.checkOrphans())
        .then(() => instance.startServices(cfg))
        .then(instance.runCommand)
        .then(() => instance.stopServices(cfg))
    })
    .catch((e) => {
      services.stop()
      output.error(e.message || 'Process failed')
      throw new Error('Process failed')
    })
}

module.exports = instance
