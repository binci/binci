const command = {
  /**
   * Parses config object and returns array of command arguments
   * @param {object} cfg Config object of instance or service
   * @returns {array} Command arguments
   */
  getArgs: (cfg) => {
    return Object.keys(cfg)
  }
}

module.exports = command
