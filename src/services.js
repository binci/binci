const _ = require('redash')
const command = require('./command')
const proc = require('./proc')

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
    return acc.concat([{
      name: _.keys(item)[0],
      persist: item[_.keys(item)[0]].persist || false,
      args: command.get(item[_.keys(item)[0]], _.keys(item)[0])
    }])
  }, []),
  /**
   * Runs services and resolves or rejects
   * @param {array} svc Array of service command arrays
   * @returns {object} promise
   */
  run: (svc) => Promise.all(svc.reduce((acc, cur) =>
    acc.concat([proc.run(cur.args, true).then(() => {
      services.running.push(command.getName(cur.name, { persist: cur.persist }))
    })]), [])),
  /**
   * Kills all running services
   * @returns {object} promise
   */
  stop: () => {
    if (services.running.length) {
      proc.runDetached(services.running.reduce((acc, cur, i) => {
        if (cur.indexOf('dl_') !== 0) return acc // Don't stop persisted services
        return `${acc}${i > 0 ? ' && ' : ''}docker stop ${cur} && docker rm ${cur}`
      }, ''))
    }
  }
}

module.exports = services
