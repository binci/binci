const yaml = require('js-yaml')
const fs = require('fs')

const output = require('./output')

const config = {
  /**
   * Loads config from yaml, attempts to parse to object
   * @param {string} (path) path to config file if not to use local $CWD/devlab.yml
   * @returns {object}
   */
  load: (path) => {
    path = path || `${process.cwd()}/devlab.yml`
    try {
      return yaml.safeLoad(fs.readFileSync(path, 'utf8'))
    } catch (e) {
      output.error('Cannot load config file')
      process.exit(1)
    }
  }
}

module.exports = config
