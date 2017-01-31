const _ = require('redash')

const pad = (len, str) => str.length < len ? str + ' '.repeat(len - str.length) : str

const commands = {
  /**
   * List all available tasks
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
  }
}

module.exports = commands
