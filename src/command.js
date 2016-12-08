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
    return acc.concat([ command.args[type], item ])
  }, []),
  /**
   * Parses config object and returns array of command arguments
   * @param {object} cfg Config object of instance or service
   * @returns {array} Command arguments
   */
  getArgs: (cfg) => Object.keys(cfg).reduce((acc, item) => {
    if (command.args[item] && Array.isArray(cfg[item])) {
      return acc.concat(command.parseArgs(item, cfg[item]))
    } else if (command.args[item] && !Array.isArray(cfg[item])) {
      output.warn(`Config error: '${item}' should be an array`)
    }
    return acc
  }, []),
  /**
   * Returns array of execution commands
   * @param {object} cfg Config object for instance
   * @returns {array} Array of execution tasks
   */
  getExec: (cfg) => {
    // Custom exec, just run native task
    if (cfg.exec) return [ '/bin/sh', '-c', `"${cfg.task}"` ]
    // Use predefined task
    if (!cfg.tasks || !cfg.tasks[cfg.task]) {
      output.error(`Task '${cfg.task}' does not exist`)
      process.exit(1)
    } else {
      return [ '/bin/sh', '-c', `"${cfg.tasks[cfg.task].replace('\n', '; ')}"` ]
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
    let args = [ 'run', '--rm', '-v', `${cwd}:${cwd}`, '-w', cwd ]
    args = args.concat(command.getArgs(cfg))
    args = primary ? args.concat[command.getExec(cfg)] : ''
    return args
  }
}

module.exports = command
