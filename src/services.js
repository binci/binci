const _ = require('redash')
const command = require('./command')
const proc = require('./proc')

const services = {
  /**
   * @property {array} All running services for this instance
   */
  running: [],
  /**
   * Gets all services and returns name, persistence, and arguments
   * @param {array} cfg Instance config object
   * @returns {array} Array of services names, persistence and run args
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
  run: (svc) => Promise.all(svc.reduce((acc, cur) => {
    let curName = command.getName(cur.name, { persist: cur.persist })
    return acc.concat([proc.exec(`docker ps -f name=${curName} -q`).then((res) => {
      if (res && res.toString().length) return Promise.resolve() // Already running, resolve
      return proc.run(cur.args, true).then(() => services.running.push(curName))
    })])
  }, [])),
  /**
   * Kills all running services with detached process
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
