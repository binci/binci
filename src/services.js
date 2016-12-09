const command = require('./command')

const services = {
  /**
   * Gets all services and returns name and arguments
   * @param {array} cfg Instance config object
   * @returns {array} Array of services names and run args
   */
  get: (cfg) => {
    return !cfg.services ? false : cfg.services.reduce((acc, item) => {
      acc.push({ name: Object.keys(item)[0], args: command.getArgs(item[Object.keys(item)[0]]) })
      return acc
    }, [])
  },
  /**
   * Runs services and resolves or rejects
   * @param {array} cfg Instance config object
   * @returns {object} promise
   */
  run: (cfg) => {

  }
}

module.exports = services
