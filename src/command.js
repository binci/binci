const output = require('./output')

const command = {
  /**
   * Parses host environment variables specified with ${VAR}
   * @param {String} str The string to parse
   * @returns {String}
   */
  parseHostEnvVars: str => str.toString().replace(/\$\{([^}]+)\}/g, (i, match) => {
    return process.env.hasOwnProperty(match) ? process.env[match] : null
  }),
  /**
   * @property {object} available args parsing instructions
   */
  args: {
    expose: '-p',
    volumes: '-v',
    env: '-e'
  },
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
  }, [])
}

module.exports = command
