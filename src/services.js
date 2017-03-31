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
    // If any running task doesn't have object config, keep all services
    if (objs.length !== tasks.length) return cfg
    const svcs = _.chain(t => t.disable === '*' ? _.map(_.keys, cfg.services) : t.disable, objs)
    // Track which services are disabled by running tasks
    const counts = _.pipe([
      _.groupBy(_.identity),
      _.map(_.length)
    ])(svcs)
    // Add service to list if disabled by all running tasks
    services.disabled = _.keys(_.filter(_.equals(objs.length), counts))
    if (!services.disabled.length) return cfg
    // Keep service if name is not in disabled list
    cfg.services = _.filter((s) => !_.contains(_.head(_.keys(s)), services.disabled), cfg.services)
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
      args: command.get(value, name, null)
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
   * Kills all running, non-persisted services
   * @returns {object} promise
   */
  stop: () => {
    const errors = []
    return Promise.all(_.unless(
      _.isEmpty,
      _.pipe([
        _.filter(_.test(/dl_/)),
        _.map(svc => proc.run([ 'stop', svc ], true).catch(() => errors.push(svc)))
      ])
    )(services.running))
      .then(() => {
        const stopError = new Error()
        if (errors.length) {
          stopError.svcs = errors
          throw stopError
        }
      })
  }
}

module.exports = services
