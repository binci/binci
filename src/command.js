const _ = require('redash')
const output = require('./output')

const command = {
  /**
   * @property {array} default arguments
   */
  defaultArgs: [ '--rm' ],
  /**
   * @property {object} available args parsing instructions
   */
  args: {
    expose: '-p',
    volumes: '-v',
    env: '-e'
  },
  /**
   * Parses host environment variables specified with ${VAR}
   * @param {String} str The string to parse
   * @returns {String}
   */
  parseHostEnvVars: str => str.toString().replace(/\$\{([^}]+)\}/g, (i, match) => {
    return process.env.hasOwnProperty(match) ? process.env[match] : null
  }),
  /**
   * Reduces args array into flagged arguments list
   * @param {string} type Name of the argument
   * @param {array} args Array of values
   * @returns {array}
   */
  parseArgs: (type, args) => args.reduce((acc, item) => {
    return acc.concat([ command.args[type], command.parseHostEnvVars(item) ])
  }, []),
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
        output.warn(`Config error: '${key}' should be an array`)
        return []
      }],
      [_.always(true), (key) => command.parseArgs(key, cfg[key])]
    ]))
  )(cfg),
  /**
   * Formats task by replacing line breaks with semicolons
   * @param {string} task The task command(s)
   * @returns {string} Formatted task
   */
  formatTask: (task) => task.replace('\n', '; '),
  /**
   * Returns array of execution commands
   * @param {object} cfg Config object for instance
   * @returns {array} Array of execution tasks
   */
  getExec: (cfg) => {
    // Set `before` command
    const before = cfg.before ? `${command.formatTask(cfg.before)}; ` : ''
    // Custom exec, just run native task
    if (cfg.exec) return [ '/bin/sh', '-c', `"${before}${cfg.task}"` ]
    // Get from
    // Use predefined task
    if (!cfg.tasks || !cfg.tasks[cfg.task]) {
      output.error(`Task '${cfg.task}' does not exist`)
      process.exit(1)
    } else {
      return [ '/bin/sh', '-c', `"${before}${command.formatTask(cfg.tasks[cfg.task])}"` ]
    }
  },
  /**
   * Returns full command
   * @param {object} cfg Config object for instance
   * @param {boolean} primary If this is primary (not service container)
   * @returns {array} Arguments for docker command
   */
  get: (cfg, primary = false) => {
    if (!cfg.from) {
      output.error('Missing \'from\' property in config or argument')
      process.exit(1)
    }
    const cwd = process.cwd()
    let args = primary ? [ 'run', '--rm', '-v', `${cwd}:${cwd}`, '-w', cwd, '--privileged' ] : [ 'run', '--rm', '-d', '--privileged' ]
    args = args.concat(command.getArgs(cfg))
    args = args.concat([ cfg.from ])
    args = primary ? args.concat(command.getExec(cfg)) : args
    return args
  }
}

module.exports = command
