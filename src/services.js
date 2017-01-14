const _ = require('redash')
const command = require('./command')
const proc = require('./proc')

const services = {
  /**
   * @property {array} All running services for this instance
   */
  running: [],
  /**
   * @property {array} All services disabled by instance task
   */
  disabled: [],
  /**
   * Checks if given task has a 'disable' key, and removes services accordingly
   * @param {Object} cfg Instance config object
   * @returns {Object} formatted config object
   */
  checkDisabled: (cfg) => {
    // TODO: chained command edge cases:
    //  - only one disables a service (don't disable)
    //  - both/all ignore the same service (disable)
    //  - both/all ignore the same service, but one or
    //    more disable others (disable shared service, ignore others)
    // For now, assume only 1 task has a disable key,
    // therefore any others will require all services.
    if (!cfg.run.length || cfg.run.length > 1) return cfg
    // Filter tasks that are being run, and are objects
    const disableList = _.filter(_.isType('object'), _.values(_.pick(cfg.run, cfg.tasks)))
    services.disabled = _.chain(t => t.disable, disableList) // TODO: only want unique values
    if (!services.disabled.length) return cfg
    // TODO: there's OBVIOUSLY a more efficient way to do this, just not seeing it...
    const svcs = []
    _.forEach(svc => {
      _.forEach(dis => {
        // Keep service if name is not in disabled list
        if (!_.has(dis, svc)) svcs.push(svc)
      }, services.disabled)
    }, cfg.services)
    cfg.services = svcs
    return cfg
  },
  /**
   * Gets all services and returns name, persistence, and arguments
   * @param {Object} cfg Instance config object
   * @returns {array} Array of services names, persistence and run args
   */
  get: (cfg) => !cfg.services ? false : _.map(_.pipe([
    _.toPairs,
    _.head,
    ([name, value]) => ({
      name,
      persist: value.persist || false,
      args: command.get(value, name)
  })]), cfg.services),
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
    _.pipe([
      _.filter(_.test(/dl_/)),
      _.map(svc => `docker stop ${svc} && docker rm ${svc}`),
      _.join(' && '),
      proc.runDetached
    ])
  )(services.running)
}

module.exports = services
