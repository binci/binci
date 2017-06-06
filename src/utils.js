'use strict'

const _ = require('halcyon')
const proc = require('./proc')
const output = require('./output')
const cp = require('child_process')
const cmp = require('semver-compare')

/* istanbul ignore next: just a helper, will fail other tests */
const pad = (len, str) => str.length < len ? str + ' '.repeat(len - str.length) : str

const utils = {
  /**
   * Outputs all available tasks in binci config
   */
  tasks: () => {
    const cfg = require('./config').load()
    const tasks = _.keys(cfg.tasks)
    const maxTaskLen = _.pipe([
      _.map(_.prop('length')),
      _.max
    ])(tasks)
    console.log([
      '',
      'Tasks:',
      ..._.map(task => `  ${pad(maxTaskLen + 4, task)}${cfg.tasks[task]}`, tasks)
    ].join('\n'))
  },
  /**
   * Runs docker stop && docker rm on containers currently running
   * @param {boolean} all If the run should include non-binci containers
   * @returns {object} promise
   */
  cleanup: (all = false) => Promise.resolve().then(() => {
    const findCmd = all ? 'docker ps -q' : 'docker ps --filter="name=bc_" -q'
    const ids = cp.execSync(findCmd)
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)

    if (!ids.length) {
      output.success('All clean')
      return
    }

    output.info(`Stopping ${ids.length} containers:`)

    return Promise.all(ids.map(id => {
      return proc.run(['stop', id], true)
        .then(() => output.success(id))
        .catch(() => output.error(id))
    }))
  }),
  /**
   * Identifies and reports any (possible) orphan containers, i.e. containers
   * which 1) have the bc_ prefix, 2) are NOT primary containers and 3) have
   * no primary container running - deteremined by InstanceId suffix
   * @returns {array} Names of orphaned containers
   */
  parseOrphans: (ps) => _.pipe([
    _.split(/\r?\n/),
    _.drop(1),
    _.map((row) => {
      let data = _.split(/\s\s+/g, row)
      return [_.last(data), data[3]]
    }),
    _.filter((data) => _.test(/bc_/, _.head(data))),
    _.map(([name, created]) => ({ instance: name.replace(/bc_\w+_/, ''), name, created })),
    _.partition(container => _.test(/bc_primary/, container.name)),
    ([primaries, others]) => {
      const primaryInstances = _.map(c => c.instance, primaries)
      return _.reject(c => _.contains(c.instance, primaryInstances), others)
    },
    _.filter((orph) => {
      const [num, meas] = _.split(/\s/g, orph.created)
      if (meas === 'seconds') return false
      if (_.test(/minute/, meas)) return +num >= 5
      return true
    }),
    _.map(_.prop('name'))
  ])(ps),
  /**
   * Outputs warning if any orphaned containers are found
   * @returns {object} promise
   */
  checkOrphans: () => proc.exec('docker ps').then((ps) => {
    const orphans = utils.parseOrphans(ps)
    if (orphans.length) {
      output.line()
      output.warn(`These containers may not have exited correctly: ${orphans.join(', ')}`)
      output.warn('You can attempt to remove these by running `binci --cleanup`')
      output.line()
    }
    return true
  }),
  /**
   * Parses Docker version information and stores version globally, or throws error
   * if Docker is not installed.
   * @returns {object} promise
   */
  checkVersion: () => proc.exec('docker -v')
    .then((v) => {
      const version = v.split(' ')[2].match(/([^,])/g).join('')
      return !!(cmp(version, '1.13') === -1)
    })
    .catch(() => {
      throw new Error('Docker not installed')
    })
}

module.exports = utils
