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
  get: (cfg) => !cfg.services ? false : _.map(_.pipe(
    _.toPairs,
    _.head,
    ([name, value]) => ({
      name,
      persist: value.persist || false,
      args: command.get(value, name)
    })), cfg.services),
  /**
   * Runs services and resolves or rejects
   * @param {array} svc Array of service command arrays
   * @returns {object} promise
   */
  run: (svc) => Promise.all(_.map((cur) => {
    let curName = command.getName(cur.name, { persist: cur.persist })
    return proc.exec(`docker ps -f name=${curName} -q`).then((res) => {
      if (res && res.toString().length) return Promise.resolve() // Already running, resolve
      return proc.run(cur.args, true).then(() => services.running.push(curName))
    })
  }, svc)),
  /**
   * Kills all running services with detached process
   */
  stop: () => _.unless(
    _.isEmpty,
    _.pipe(
      _.filter(_.test(/dl_/)),
      _.map(svc => `docker stop ${svc} && docker rm ${svc}`),
      _.join(' && '),
      proc.runDetached
  ))(services.running)
}

module.exports = services
