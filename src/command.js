'use strict'

const _ = require('halcyon')

const command = {
  /**
   * @property {object} available args parsing instructions, matches config name
   * with command argument
   */
  args: {
    expose: '-p',
    volumes: '-v',
    env: '-e',
    hosts: '--add-host'
  },
  /**
   * Parses host environment variables specified with ${VAR}
   * @param {String} str The string to parse
   * @returns {String}
   */
  parseHostEnvVars: (str) => str.toString().replace(/\$\{([^}]+)\}/g, (i, match) => {
    return process.env.hasOwnProperty(match) ? process.env[match] : null
  }),
  /**
   * Reduces args array into flagged arguments list
   * @param {string} type Name of the argument
   * @param {array} args Array of values
   * @returns {array}
   */
  parseArgs: (type, args) => _.chain((item) => ([command.args[type], command.parseHostEnvVars(item)]), args),
  /**
   * Parses config object and returns container name. Will have bc_ prefix and
   * InstanceID suffix if ephemeral, unaltered name for persisted containers
   * @param {object} cfg Config object
   * @returns {string}
   */
  getName: (name, cfg) => {
    if (cfg.persist) return name
    return `bc_${name}_${global.instanceId}`
  },
  /**
   * Parses config object and returns array of command arguments
   * @param {object} cfg Config object of instance or service
   * @returns {array} Command arguments
   */
  getArgs: (cfg) => _.pipe([
    _.keys,
    _.filter((key) => !!command.args[key]),
    _.chain(_.cond([
      [(key) => !_.isType('Array', cfg[key]), (key) => {
        throw new Error(`Config error: '${key}' should be an array`)
      }],
      [_.T, (key) => command.parseArgs(key, cfg[key])]
    ]))
  ])(cfg),
  /**
   * Returns array of execution commands
   * @param {object} cfg Config object for instance
   * @returns {string} Execution script
   */
  getExec: (cfg) => {
    const sh = '#!/bin/sh\nset -e;\n'
    const before = cfg.before ? `${cfg.before}\n` : ''
    const after = cfg.after ? `\n${cfg.after}` : ''
    // Custom exec, just run native task
    if (cfg.exec) return sh + before + cfg.exec + after
    // Ensure tasks exist
    if (!cfg.tasks) throw new Error('No tasks are defined')
    // Ensure a task is passed
    if (!cfg.run) throw new Error('No task has been specified')
    // Use predefined task(s)
    const run = _.pipe([
      tasks => _.pick(tasks, cfg.tasks),
      _.toPairs,
      _.map(([name, command]) => {
        if (!command) throw new Error(`Task '${name}' does not exist.`)
        if (_.isType('object', command)) {
          if (!command.cmd) throw new Error(`Task '${name}' has no command defined.`)
          return command.cmd
        }
        return command
      }),
      _.join('\n')
    ])(cfg.run)
    return sh + before + run + after
  },
  /**
   * Returns array of link arguments
   * @param {object} cfg Config object for the container
   * @returns {array} Link arguments
   */
  getLinks: (cfg) => _.chain(_.pipe([_.toPairs, _.head, ([key, value]) => {
    return ['--link', `${command.getName(key, value)}:${key}`]
  }]))(cfg.services || []),
  /**
   * Returns full command arguments array
   * @param {object} cfg Config object for instance
   * @param {string} name Container name
   * @param {string} tmpdir Path to temp execution file
   * @param {boolean} primary If this is primary, i.e. not a service container
   * @returns {object|array} Arguments for docker command
   */
  get: (cfg, name, tmpdir, primary = false) => {
    if (!cfg.from) throw new Error('Missing \'from\' property in config or argument')
    const cwd = process.cwd()
    const serviceArgs = cfg.rmOnShutdown ? ['run', '-d', '--privileged'] : ['run', '-d', '--rm', '--privileged']
    let args = primary ? ['run', '--rm', '-it', '-v', `${cwd}:${cwd}`, '-v', `${tmpdir}:${tmpdir}`, '-w', cwd, '--privileged'] : serviceArgs
    args = args.concat(_.flatten([
      command.getArgs(cfg),
      command.getLinks(cfg),
      ['--name', command.getName(name, cfg)],
      cfg.from,
      primary ? ['sh', `${tmpdir}/binci.sh`] : []
    ]))
    return primary ? { args, cmd: command.getExec(cfg) } : args
  }
}

module.exports = command
