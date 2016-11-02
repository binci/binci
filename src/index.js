const min = require('minimist')

const instance = {

  /**
   * @property {number} generated timstamp as identifier of this instance
   */
  id: Date().now,

  /**
   * @property {object} arguments passed to this instance
   */
  args: min(process.argv.slice(process.argv[0] === 'node' ? 1 : 2))

}

module.exports = instance
