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
   *
   */
  count: {},
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
    // Filter running tasks with object configs and flatten to `disable` arrays
    const svcs = _.flattenDeep(_.map(t => {
      if (t.disable === '*') return _.map(_.keys, cfg.services)
      return t.disable
    }, objs))
    // @TODO: not sure about this
    services.count = svcs.reduce((obj, s) => {
      obj[s] = !obj[s] ? 1 : obj[s] + 1
      return obj
    }, {})
    // @TODO: use pipe
    services.disabled = _.map(n => _.head(n),
      _.filter(s => _.equals(_.last(s), objs.length), _.toPairs(services.count))
    )
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
