/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import Promise from 'bluebird';
import username from 'username';
import config from './lib/config';
import services from './lib/services';
import proc from './lib/process';
import output from './lib/output';
import parsers from './lib/parsers';
import forwarders from './lib/forwarders';
import url from 'url';

// Process timer
const start = new Date().getTime();

const core = {

  // Service links placeholder
  links: [],

  // Create run-time manifest from config
  manifest: null,

  /**
   * Builds command arguments for executing task
   * @returns {String} The command to execute the task
   */
  buildArgs: () => {
    const env = core.manifest.env ? parsers.parseEnvVars(core.manifest.env) : [];
    const ports = core.manifest.expose ? parsers.parseExpose(core.manifest.expose) : [];
    const volumes = core.manifest.volumes ? parsers.parseVolumes(core.manifest.volumes) : [];
    // Spawn arguments
    let mode = core.manifest.interactive || process.stdout.isTTY  ? '-it' : '-t';
    let args = [ 'run', '--privileged', mode ];
    // Check for no-rm
    if (!process.env.DEVLAB_NO_RM || process.env.DEVLAB_NO_RM === 'false') args.push('--rm');
    // Workdir config
    const workdir = [ '-v', `${core.manifest.workdir}:${core.manifest.workdir}`, '-w', core.manifest.workdir ];
    // Set name
    const name = [ '--name', `devlab_${core.manifest.workdir.split('/').pop()}_${config.manifest.username}_${config.instance}`.toLowerCase() ];
    // From (image) config
    const from = [ core.manifest.from ];
    // Split command into (space delimited) parts
    const cmd = [ 'sh', '-c', core.manifest.run ];
    // Build full args array
    args = core.links.length ? args.concat(core.links) : args;
    args = env.length ? args.concat(env) : args;
    args = ports.length ? args.concat(ports) : args;
    args = volumes.length ? args.concat(volumes) : args;
    args = args.concat(workdir);
    args = args.concat(name);
    args = args.concat(from);
    args = args.concat(cmd);
    return args;
  },

  /**
   * Check for and starts services
   * @param {Array} svc Array of services from manifest
   * @returns {Object} promise
   */
  startServices: (svc) => {
    return new Promise((resolve, reject) => {
      if (!svc) {
        resolve();
      } else {
        let svcNames = [];
        svc.forEach((s) => {
          let tmp = parsers.parseSvcObj(s);
          svcNames.push(tmp.name);
        });
        services.run(svc)
          .then((links) => {
            // Create links array for insert into run
            links.map((l) => { core.links = core.links.concat([ '--link', l ]); });
            resolve();
          })
          .catch((e) => {
            output.error(e);
            reject(1);
          });
      }
    });
  },

  /**
   * Forward any host-exposed ports that haven't explicitly disabled forwarding from localhost to the remote machine,
   * if docker is configured to connect to a remote daemon.
   * @returns {Promise} Resolves after forwarding is complete.
   */
  startForwarders: () => {
    const ports = parsers.parseForwardedPorts(core.manifest);
    if (!ports.length || !process.env.DOCKER_HOST) {
      // Pass; nothing to do
      return Promise.resolve();
    }
    const host = url.parse(process.env.DOCKER_HOST).hostname;
    if (!host) {
      return Promise.reject(new Error('DOCKER_HOST is malformed. Cannot start forwarders.'));
    }
    return forwarders.startForwarders(host, ports);
  },

  /**
   * Executes the task with arguments
   * @param {Array} args Array of arguments
   * @returns {Object} promise
   */
  execTask: (args) => {
    output.success(`Running container {{${core.manifest.from}}}, task {{${core.manifest.run}}}`);
    return proc('docker', args);
  },

  /**
   * Runs the execution chain to carry out task
   */
  run: () => {
    // Get manifest from config
    core.manifest = config.get();
    // Set user
    core.manifest.username = username.sync() || 'unknown';
    // Start
    core.startServices(core.manifest.services)
      .then(core.startForwarders)
      .then(core.buildArgs)
      .then(core.execTask)
      .then(forwarders.stopForwarders)
      .then(services.stopServices)
      .then(() => {
        const closed = (new Date().getTime() - start) / 1000;
        output.success(`Completed in {{${closed}}} seconds`);
        process.exit(0);
      })
      .catch((code) => {
        output.error(`Error running {{${core.manifest.run}}}, exited with code {{${code}}}`);
        forwarders.stopForwarders();
        services.stopServices();
        process.exit(code);
      });
  }

};

export default core;
