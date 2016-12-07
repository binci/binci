const yaml = require('js-yaml')
const fs = require('fs')

const output = require('./output')

const config = {
  /**
   * @property {string} default location of devlab.yml config file
   */
  defaultPath: `${process.cwd()}/devlab.yml`,
  /**
   * Loads config from yaml, attempts to parse to object
   * @param {string} (path) path to config file if not to use local $CWD/devlab.yml
   * @returns {object}
   */
  load: (path = config.defaultPath) => {
    try {
      return yaml.safeLoad(fs.readFileSync(path, 'utf8'))
    } catch (e) {
      output.error('Cannot load config file. Please ensure you have a valid ./devlab.yml file or specify one with the `-c` flag')
      process.exit(1)
    }
  }
}

module.exports = config
