const yaml = require('js-yaml')
const fs = require('fs')

const config = {
  /**
   * @property {string} Default location of devlab.yml config file
   */
  defaultPath: `${process.cwd()}/devlab.yml`,
  /**
   * Loads config from yaml, attempts to parse to object
   * @param {string} (path) Path to config file or use defaultPath
   * @returns {object}
   */
  load: (path = config.defaultPath) => {
    try {
      return yaml.safeLoad(fs.readFileSync(path, 'utf8'))
    } catch (e) {
      throw new Error('Cannot load config file. Please ensure you have a valid ./devlab.yml file or specify one with the `-c` flag')
    }
  }
}

module.exports = config
