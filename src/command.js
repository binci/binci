const _ = require('redash')

const command = {
  /**
   * @property {object} available args parsing instructions, matches config name
   * with command argument
   */
  args: {
    expose: '-p',
    volumes: '-v',
    env: '-e',
    hosts: '--add-host'
  },
  /**
   * Parses host environment variables specified with ${VAR}
   * @param {String} str The string to parse
   * @returns {String}
   */
  parseHostEnvVars: (str) => str.toString().replace(/\$\{([^}]+)\}/g, (i, match) => {
    return process.env.hasOwnProperty(match) ? process.env[match] : null
  }),
  /**
   * Reduces args array into flagged arguments list
   * @param {string} type Name of the argument
   * @param {array} args Array of values
   * @returns {array}
   */
  parseArgs: (type, args) => _.chain((item) => ([ command.args[type], command.parseHostEnvVars(item) ]), args),
  /**
   * Parses config object and returns conatiner name. Will have dl_ prefix and
   * InstanceID suffix if ephemeral, unaltered name for persisted containers
   * @param {object} cfg Config object
   * @returns {string}
   */
  getName: (name, cfg) => {
    if (cfg.persist) return name
    return `dl_${name}_${global.instanceId}`
  },
  /**
   * Parses config object and returns array of command arguments
   * @param {object} cfg Config object of instance or service
   * @returns {array} Command arguments
   */
  getArgs: (cfg) => _.pipe(
    _.keys,
    _.filter((key) => !!command.args[key]),
    _.chain(_.cond([
      [(key) => !_.isType('Array', cfg[key]), (key) => {
        throw new Error(`Config error: '${key}' should be an array`)
      }],
      [_.T, (key) => command.parseArgs(key, cfg[key])]
    ]))
  )(cfg),
  /**
   * Formats task by replacing line breaks with double-ampersands
   * @param {string} task The task command(s)
   * @returns {string} Formatted task
   */
  formatTask: (task) => task.replace(/(?:\r\n|\r|\n)/g, ' && ').replace(' &&  && ', ' && '),
  /**
   * Returns array of execution commands
   * @param {object} cfg Config object for instance
   * @returns {array} Array of execution tasks
   */
  getExec: (cfg) => {
    const before = cfg.before ? `${cfg.before} && ` : ''
    const after = cfg.after ? ` && ${cfg.after}` : ''
    // Custom exec, just run native task
    if (cfg.exec) return [ 'sh', '-c', command.formatTask(before + cfg.exec + after) ]
    // Ensure tasks exist
    if (!cfg.tasks) throw new Error('No tasks are defined')
    // Ensure a task is passed
    if (!cfg.task) throw new Error('No task has been specified')
    // Use predefined task(s)
    const tasks = _.pipe(
      _.reduce((acc, task) => {
        if (!cfg.tasks[task]) throw new Error(`Task '${task}' does not exist`)
        return acc.concat([cfg.tasks[task]])
      }, []),
      _.join(' && ')
    )(cfg.task)
    return [ 'sh', '-c', command.formatTask(before + tasks + after) ]
  },
  /**
   * Returns array of link arguments
   * @param {object} cfg Config object for the container
   * @returns {array} Link arguments
   */
  getLinks: (cfg) => _.chain(_.pipe(_.toPairs, _.head, ([key, value]) => {
    return ['--link', `${command.getName(key, value)}:${key}`]
  }))(cfg.services || []),
  /**
   * Returns full command arguments array
   * @param {object} cfg Config object for instance
   * @param {string} name Container name
   * @param {boolean} primary If this is primary, i.e. not a service container
   * @returns {array} Arguments for docker command
   */
  get: (cfg, name, primary = false) => {
    if (!cfg.from) throw new Error('Missing \'from\' property in config or argument')
    const cwd = process.cwd()
    let args = primary ? [ 'run', '--rm', '-it', '-v', `${cwd}:${cwd}`, '-w', cwd, '--privileged' ] : [ 'run', '-d', '--privileged' ]
    args = args.concat(_.flatten([
      command.getArgs(cfg),
      command.getLinks(cfg),
      [ '--name', command.getName(name, cfg) ],
      cfg.from,
      primary ? command.getExec(cfg) : []
    ]))
    return args
  }
}

module.exports = command
