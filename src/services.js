const _ = require('redash')
const command = require('./command')

const services = {
  /**
   * @property {array} All running services
   */
  running: [],
  /**
   * Gets all services and returns name and arguments
   * @param {array} cfg Instance config object
   * @returns {array} Array of services names and run args
   */
  get: (cfg) => !cfg.services ? false : cfg.services.reduce((acc, item) => {
    return acc.concat([{ name: _.keys(item)[0], args: command.get(item[_.keys(item)[0]], _.keys(item)[0]) }])
  }, []),
  /**
   * Runs services and resolves or rejects
   * @param {array} cfg Instance config object
   * @returns {object} promise
   */
  run: (cfg) => {

  }
}

module.exports = services
