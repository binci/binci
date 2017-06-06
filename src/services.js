'use strict'

const _ = require('halcyon')
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
  filterEnabled: (cfg) => {
    if (!cfg.run.length) return cfg
    const tasks = _.values(_.pick(cfg.run, cfg.tasks))
    const objs = _.filter(_.isType('object'), tasks)
    // If any running task doesn't have object config and no services specified in command line, keep all services
    if (objs.length !== tasks.length && !services.disabled.length && !services.disableAll) return cfg
    const allSvcs = _.chain(_.keys, cfg.services)
    let svcs
    if (services.disableAll) {
      svcs = allSvcs
    } else {
      svcs = _.chain(t => t.disable === '*' ? allSvcs : t.disable, objs)
      services.disabled.forEach(s => {
        if (!_.contains(s, svcs)) svcs.push(s)
      })
    }
    // Track which services are disabled by running tasks
    const counts = _.pipe([
      _.groupBy(_.identity),
      _.map(_.length)
    ])(svcs)
    // Add service to list if disabled by all running tasks
    services.disabled = _.keys(_.filter(_.equals(tasks.length), counts))
    /* istanbul ignore if: lots of work, testing doesn't prove anything... */
    if (!services.disabled.length) return cfg
    // Keep service if name is not in disabled list
    cfg.services = _.filter((s) => !_.contains(_.head(_.keys(s)), services.disabled), cfg.services)
    return cfg
  },
  /**
   * Returns stopTimeSecs prop from either the (1) service config (2) global config or (3) default
   * @param {object} cfg Instance config object
   * @param {object} svc Service config object
   * @returns {number}
   */
  getStopTimeSecs: (cfg, svc) => {
    if (_.isType('number', svc.stopTimeSecs)) return svc.stopTimeSecs
    if (_.isType('number', cfg.stopTimeSecs)) return cfg.stopTimeSecs
    return 10
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
      stopTimeSecs: services.getStopTimeSecs(cfg, value),
      args: command.get(_.merge(value, { rmOnShutdown: cfg.rmOnShutdown }), name, null)
    })]), cfg.services),
  /**
   * Runs services and resolves or rejects
   * @param {array} svc Array of service command arrays
   * @returns {object} promise
   */
  run: (svc) => {
    const errors = []
    return Promise.all(_.map((cur) => {
      let curName = command.getName(cur.name, { persist: cur.persist })
      return proc.exec(`docker ps -f name=${curName} -q`).then((res) => {
        if (res && res.toString().length) return Promise.resolve() // Already running, resolve
        return proc.run(cur.args, true)
          .then(() => services.running.push({ name: curName, stopTimeSecs: cur.stopTimeSecs }))
          .catch(() => errors.push(cur.name))
      })
    }, svc))
    .then(() => {
      const startError = new Error()
      if (errors.length) {
        startError.svcs = errors
        throw startError
      }
    })
  },
  /**
   * Kills all running, non-persisted services
   * @returns {object} promise
   */
  stop: (cfg) => {
    const errors = []
    return Promise.all(
      _.pipe([
        _.filter(svc => _.test(/bc_/, svc.name)),
        _.map(svc => proc.run(['stop', '-t', svc.stopTimeSecs, svc.name], true)
          .then(() => cfg.rmOnShutdown ? proc.run(['rm', svc.name], true) : Promise.resolve())
          .catch(() => {
            /* istanbul ignore next: difficult to make a container shutdown fail reliably */
            errors.push(svc.name)
          })
        )
      ])(services.running))
      .then(() => {
        const stopError = new Error()
        /* istanbul ignore next: this is actually tested, istanbul... */
        if (errors.length) {
          stopError.svcs = errors
          throw stopError
        }
      })
  }
}

module.exports = services
