const utils = {
  /**
   * Runs docker stop && docker rm on containers currently running
   * @param {boolean} all If the run should include non-devlab containers
   * @returns {object} promise
   */
  cleanup: (all = false) => Promise.resolve().then(() => {
    return true
  }),
  /**
   * Identifies and reports any (possible) orphan containers, i.e. containers
   * which 1) have the dl_ prefix, 2) are NOT primary containers and 3) have
   * no primary container running - deteremined by InstanceId suffix
   * @returns {object} promise
   */
  findOrphans: () => Promise.resolve().then(() => {
    return true
  })
}

module.exports = utils
