const output = require('./output')
const ostmpdir = require('os-tmpdir')
const fs = require('fs')

/**
 * Method to determine where to save binci.sh tmp file
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
  if (process.env.BINCI_TMP && isWriteable(process.env.BINCI_TMP)) {
    // Use user-specified BINCI_TMP
    return process.env.BINCI_TMP
  } else if (isWriteable('/tmp')) {
    // Use (most common) /tmp
    return '/tmp'
  } else if (isWriteable(require('os-tmpdir')())) {
    // Use os-tmpdir's determination
    return ostmpdir()
  } else {
    // No go, inform user they need to specify manually
    output.error('Could not locate temp dir for writing, please specify BINCI_TMP environment variable')
    process.exit(1)
  }
}
