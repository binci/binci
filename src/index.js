/*
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict'
const Promise = require('bluebird')
const username = require('username')
const FSEventBridgeClient = require('fs-eventbridge-js')
const config = require('./lib/config')
const services = require('./lib/services')
const proc = require('./lib/process')
const output = require('./lib/output')
const parsers = require('./lib/parsers')
const forwarders = require('./lib/forwarders')
const url = require('url')

// run-time manifest (from config)
let manifest
// Service links placeholder
let serviceLinks = []
// FS-EventBridge client
let bridge = { stop: () => {} }
// Remote docker host, if applicable
let dockerHost

/**
 * Check for and starts services
 * @param {Array} svc Array of services from manifest
 * @returns {Object} promise
 */
const startServices = svc =>
  !svc ? Promise.resolve() :
    services.run(svc)
      .then(sLinks => {
        // Create links array for insert into run
        serviceLinks = sLinks.reduce((links, l) => {
          return links.concat([ '--link', l ])
        }, serviceLinks)
      })
      .catch(e => {
        output.error(e)
        throw 1 // eslint-disable-line no-throw-literal
      })

const getDockerHost = () => {
  if (!dockerHost) {
    dockerHost = url.parse(process.env.DOCKER_HOST).hostname
    if (!dockerHost) throw new Error('DOCKER_HOST is malformed. Correct it and try again.')
  }
  return dockerHost
}

const startEventBridge = () => {
  if (process.env.DOCKER_HOST && process.env.FS_EVENTBRIDGE_PORT) {
    bridge = new FSEventBridgeClient({
      host: getDockerHost(),
      port: process.env.FS_EVENTBRIDGE_PORT
    })
    return bridge.start().then(() => {
      output.success(`Bridging filesystem events on ${process.cwd()}`)
    }).catch(e => {
      output.warn(`Filesystem event bridge failed: ${e.message}`)
    })
  }
}

/**
 * Forward any host-exposed ports that haven't explicitly disabled forwarding from localhost to the remote machine,
 * if docker is configured to connect to a remote daemon.
 * @returns {Promise} Resolves after forwarding is complete.
 */
const startForwarders = () => {
  const ports = parsers.parseForwardedPorts(manifest)
  // Pass; nothing to do
  if (!ports || !ports.length || !process.env.DOCKER_HOST) return Promise.resolve()
  return forwarders.startForwarders(getDockerHost(), ports)
}

/**
 * Builds command arguments for executing task
 * @returns {Array} The command to execute the task
 */
const buildArgs = () => {
  const env = manifest.env ? parsers.parseEnvVars(manifest.env) : []
  const ports = manifest.expose ? parsers.parseExpose(manifest.expose) : []
  const volumes = manifest.volumes ? parsers.parseVolumes(manifest.volumes) : []
  const hosts = manifest.hosts ? parsers.parseHostMap(manifest.hosts) : []
  // Spawn arguments
  const mode = manifest.interactive || process.stdout.isTTY  ? '-it' : '-t'
  const args = [ 'run', '--privileged', mode ]
  // Check for no-rm
  if (!process.env.DEVLAB_NO_RM || process.env.DEVLAB_NO_RM === 'false') args.push('--rm')
  // Workdir config
  const workdir = [ '-v', `${manifest.workdir}:${manifest.workdir}`, '-w', manifest.workdir ]
  // Set name
  const name = [ '--name', `devlab_${manifest.workdir.split('/').pop()}_${config.manifest.username}_${config.instance}`.toLowerCase() ]
  // From (image) config
  const from = [ manifest.from ]
  // Split command into (space delimited) parts
  const cmd = [ 'sh', '-c', manifest.run ]
  // Build full args array
  return args
    .concat(serviceLinks.length && serviceLinks || [])
    .concat(env.length && env || [])
    .concat(ports.length && ports || [])
    .concat(volumes.length && volumes || [])
    .concat(hosts.length && hosts || [])
    .concat(workdir).concat(name).concat(from).concat(cmd)
}

/**
 * Executes the task with arguments
 * @param {Array} args Array of arguments
 * @returns {Object} promise
 */
const execTask = args => {
  output.success(`Running container {{${manifest.from}}}, task {{${manifest.run}}}`)
  return proc('docker', args)
}

const tearDown = () => forwarders.stopForwarders()
  .then(services.stopServices)
  .then(() => bridge.stop())

const core = {

  /**
   * Runs the execution chain to carry out task
   */
  run: () => {
    // Process timer
    const start = Date.now()
    // Get manifest from config
    manifest = config.get()
    // Set user
    manifest.username = username.sync() || 'unknown'
    // Start
    return startServices(manifest.services)
      .then(startEventBridge)
      .then(startForwarders)
      .then(buildArgs)
      .then(execTask)
      .then(tearDown)
      .then(() => {
        const closed = (Date.now() - start) / 1000
        output.success(`Completed in {{${closed}}} seconds`)
        process.exit(0)
      })
      .catch(code => {
        output.error(`Error running {{${manifest.run}}}, exited with code {{${code}}}`)
        tearDown().then(() => process.exit(code))
      })
  }

}

module.exports = core
