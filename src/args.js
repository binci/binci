const args = {
  /**
   * @property {object} available run-time flags
   */
  available: {
    h: { action: 'showHelp', help: 'Displays help and usage' },
    v: { action: 'showVersion', help: 'Displays the current installed version' },
    e: { action: 'execCommand', help: 'Run a custom command instead of defined task' },
    f: { action: 'setPrimaryFrom', help: 'Run with specified docker image' },
    c: { action: 'setCustomConf', help: 'Run with custom config file path' },
    q: { action: 'setQuietMode', help: 'Run in quiet-mode, execution only output' }
  }
}

module.exports = args
