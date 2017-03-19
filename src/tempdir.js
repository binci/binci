const output = require('./output')
const fs = require('fs')

/**
 * Method to determine where to save devlab.sh tmp file
 * @returns {String} path of writeable temp dir
 */
module.exports = () => {
  /**
   * Runs sync access for W_OK to determine if we can write to the path
   * @params {String} path The path to test
   * @returns {Boolean}
   */
  const isWriteable = (path) => {
    try {
      fs.accessSync(path, fs.W_OK)
      return true
    } catch (e) {
      return false
    }
  }

  // Check our options...
  if (process.env.DEVLAB_TMP && isWriteable(process.env.DEVLAB_TMP)) {
    // Use user-specified DEVLAB_TMP
    return process.env.DEVLAB_TMP
  } else if (isWriteable('/tmp')) {
    // Use (most common) /tmp
    return '/tmp'
  } else if (isWriteable(require('os-tmpdir')())) {
    // Use os-tmpdir's determination
    return require('os-tmpdir')()
  } else {
    // No go, inform user they need to specify manually
    output.error('Could not locate temp dir for writing, please specify DEVLAB_TMP environment variable')
    process.exit(1)
  }
}
