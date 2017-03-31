'use strict'

const _ = require('halcyon')
const proc = require('./proc')
const output = require('./output')
const cp = require('child_process')

const pad = (len, str) => str.length < len ? str + ' '.repeat(len - str.length) : str

const utils = {
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
   * @param {boolean} all If the run should include non-devlab containers
   * @returns {object} promise
   */
  cleanup: (all = false) => {
    const findCmd = all ? 'docker ps -q' : 'docker ps --filter="name=dl_" -q'
    const ids = cp.execSync(findCmd).toString()
    /* istanbul ignore else */
    if (ids.length) {
      cp.execSync(_.pipe([
        _.split(/\r?\n/),
        _.filter((id) => id.length > 0),
        _.map((id) => {
          return `docker stop ${id}`
        }),
        _.join(' && ')
      ])(ids))
    }
  },
  /**
   * Identifies and reports any (possible) orphan containers, i.e. containers
   * which 1) have the dl_ prefix, 2) are NOT primary containers and 3) have
   * no primary container running - deteremined by InstanceId suffix
   * @returns {array} Names of orphaned containers
   */
  parseOrphans: (ps) => _.pipe([
    _.split(/\r?\n/),
    _.drop(1),
    _.map((row) => {
      let data = _.split(/\s\s+/g, row)
      return [ _.last(data), data[3] ]
    }),
    _.filter((data) => _.test(/dl_/, _.head(data))),
    _.map(([name, created]) => ({ instance: name.replace(/dl_\w+_/, ''), name, created })),
    _.partition(container => _.test(/dl_primary/, container.name)),
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
      output.warn('You can attempt to remove these by running `lab --cleanup`')
      output.line()
    }
    return true
  })
}

module.exports = utils
