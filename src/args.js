'use strict'

const _ = require('halcyon')
const min = require('minimist')
const pkg = require('../package.json')
const utils = require('./utils')
const services = require('./services')
const init = require('./init')
const output = require('./output')
const fs = require('fs')

/* istanbul ignore next */
const processArgs = process.argv[0] === 'node' ? 1 : 2

const args = {
  /**
   * @property {object} Arguments passed to the instance
   */
  raw: min(process.argv.slice(processArgs)),
  /**
   * @property {object} Available run-time flags
   * - @property {string} action - the method to call when parsing
   * - @property {string} prop - the prop to set when parsing
   * - @property {string} help - the help text to display to the user
   */
  available: {
    'h': { action: 'showHelp', help: 'Displays help and usage' },
    'v': { action: 'showVersion', help: 'Displays the current installed version' },
    'e': { prop: 'exec', help: 'Run a custom command instead of defined task' },
    'f': { prop: 'from', help: 'Run with specified docker image' },
    'c': { prop: 'configPath', help: 'Run with custom config file path' },
    'd': { action: 'disable', help: 'Disable specified service' },
    'init': { action: 'init', help: 'Initialize new Binci project config' },
    'disable-all': { action: 'disableAll', help: 'Disable all configured services' },
    'tasks': { action: 'tasks', help: 'List all available tasks' },
    'cleanup': { action: 'cleanupBC', help: 'Stops and removes any non-persisted Binci containers' },
    'cleanup-all': { action: 'cleanupAll', help: 'Stops and removes ALL docker containers' }
  },
  /**
   * Runs initialization script to create template binci.yml file
   */
  init: () => {
    return init()
      .then((msg) => {
        output.success(msg)
        process.exit(0)
      })
      .catch((err) => {
        output.error(err.message)
        process.exit(1)
      })
  },
  /**
   * Adds specified service names to disabled list
   */
  disable: () => {
    services.disabled = Array.isArray(args.raw.d) ? _.unique(args.raw.d) : [ args.raw.d ]
    if (_.contains('*', services.disabled)) args.disableAll()
  },
  /**
   * Marks all services to be disabled
   */
  disableAll: () => {
    services.disableAll = true
  },
  /**
   * List all available tasks
   */
  tasks: () => {
    utils.tasks()
    process.exit(0)
  },
  /**
   * Displays the help and usage message
   */
  showHelp: () => {
    let help = ''
    help += `  ${pkg.name} v.${pkg.version}\n\n`
    help += `  Usage: [${_.keys(pkg.bin).join('|')}] task [options]\n\n`
    help += _.pipe([_.toPairs, _.map(([k, v]) => `  -${k} -- ${v.help}`), _.join('\n')])(args.available)
    console.log(`${help}\n`)
    process.exit(0)
  },
  /**
   * Displays the current version
   */
  showVersion: () => {
    console.log(pkg.version)
    process.exit(0)
  },
  /**
   * Calls the cleanup process for Binci containers and exits
   */
  cleanupBC: () => {
    return utils.cleanup()
      .then(() => process.exit(0))
      .catch(() => process.exit(1))
  },
  /**
   * Calls the cleanup process for ALL containers and exits
   */
  cleanupAll: () => {
    return utils.cleanup(true)
      .then(() => process.exit(0))
      .catch(() => process.exit(1))
  },
  /**
   * Ensures argument is valid or outputs an error
   * @param {string} arg The argument to check
   * @returns {boolean}
   */
  isArg: (arg) => {
    if (args.available[arg]) return true
    throw new Error(`Invalid argument '${arg}', please see documentation`)
  },
  /**
   * Gets the task elements and returns joined string
   * @returns {string}
   */
  getTask: () => _.has('_', args.raw) ? args.raw._ : '',
  /**
   * Parse arguments and call (action) or append to config (prop)
   * @returns {object}
   */
  parse: () => Promise.resolve().then(() => {
    const cfg = {}
    const actions = []
    _.pipe([
      _.omit(['_']),
      _.keys,
      _.filter(args.isArg),
      // Accumulate props and actions
      _.forEach(key => {
        const arg = args.available[key]
        if (arg.prop) cfg[arg.prop] = args.raw[key]
        if (arg.action) actions.push(args[arg.action])
      })
    ])(args.raw)

    // Catch init command
    if (args.raw._ && args.raw._[0] === 'init') {
      try {
        // If config already exists, just move on...
        fs.statSync(`${process.cwd()}/binci.yml`)
      } catch (e) {
        return args.init()
      }
    }

    // run all actions, then return config
    return Promise.all(actions.map(action => {
      return Promise.resolve(action())
    }))
      .then(() => _.merge(cfg, { run: args.getTask() }))
  })
}

module.exports = args
