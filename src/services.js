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
    return acc.concat([{ name: _.keys(item)[0], args: command.get(item[_.keys(item)[0]], _.keys(item)[0]) }])
  }, []),
  /**
   * Runs services and resolves or rejects
   * @param {array} svc Array of service command arrays
   * @returns {object} promise
   */
  run: (svc) => Promise.all(svc.reduce((acc, cur) =>
    acc.concat([proc.run(cur.args, true).then(() => {
      services.running.push(`dl_${cur.name}`)
    })]), [])),
  /**
   * Kills all running services
   * @returns {object} promise
   */
  stop: () => Promise.all(services.running.map(cur =>
    proc.run(['stop', cur]).then(() => {
      const i = services.running.indexOf(cur)
      services.running.splice(i, 1)
    })))
}

module.exports = services
