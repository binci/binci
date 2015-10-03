import Promise from 'bluebird';
import config from './lib/config';
import services from './lib/services';
import proc from './lib/process';
import output from './lib/output';

// Process timer
const start = new Date().getTime();

const laminar = {

  // Service links placeholder
  links: [],

  // Create run-time manifest from config
  manifest: null,

  /**
   * Process environment variables
   * @param {Array} env Array of environment variables
   * @returns {Array} env var flags and args
   */
  parseEnvVars: (env) => {
    let envs = [];
    env.map((e) => {
      // Matches any ${VAR} format vars
      const matcher = (i, match) =>  process.env.hasOwnProperty(match) ? process.env[match] : null;
      // Replace matches on ${VAR}
      const envVar = e.toString().replace(/\$\{([^}]+)\}/g, matcher);
      // Concat
      envs = envs.concat([ '-e', envVar ]);
    });
    return envs;
  },

  /**
   * Process any ports to expose
   * @param {Array} expose Array of ports to expose
   * @returns {Array} port expose flags and args
   */
  parseExpose: (expose) => {
    let ports = [];
    expose.map((p) => { ports = ports.concat([ '-p', p ]); });
    return ports;
  },

  /**
   * Builds command arguments for executing task
   * @returns {String} The command to execute the task
   */
  buildArgs: () => {
    const env = laminar.manifest.env ? laminar.parseEnvVars(laminar.manifest.env) : [];
    const ports = laminar.manifest.expose ? laminar.parseExpose(laminar.manifest.expose) : [];
    // Spawn arguments
    let args = [ 'run', '-t', '--rm' ];
    // Volume config
    const volume = [ '-v', `${laminar.manifest.volume}:${laminar.manifest.volume}` ];
    // Workdir config
    const workdir = [ '-w', laminar.manifest.volume ];
    // From (image) config
    const from = [ laminar.manifest.from ];
    // Split command into (space delimited) parts
    const cmd = laminar.manifest.run.split(' ');
    // Build full args array
    args = laminar.links.length ? args.concat(laminar.links) : args;
    args = env.length ? args.concat(env) : args;
    args = ports.length ? args.concat(ports) : args;
    args = args.concat(volume);
    args = args.concat(workdir);
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
        output.success(`Starting services: {{${svc.join(', ')}}}`);
        services.run(svc)
          .then(() => {
            // Create links array for insert into run
            svc.map((l) => { laminar.links = laminar.links.concat([ '--link', l ]); });
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
   * Executes the task with arguments
   * @param {Array} args Array of arguments
   * @returns {Object} promise
   */
  execTask: (args) => {
    output.success(`Running container {{${laminar.manifest.from}}}, task {{${laminar.manifest.run}}}`);
    return proc('docker', args);
  },

  /**
   * Runs the execution chain to carry out task
   */
  run: () => {
    laminar.manifest = config.get();
    laminar.startServices(laminar.manifest.services)
      .then(laminar.buildArgs)
      .then(laminar.execTask)
      .then(() => {
        const closed = (new Date().getTime() - start) / 1000;
        output.success(`Completed in {{${closed}}} seconds`);
        process.exit(0);
      })
      .catch((code) => {
        output.error(`Error running {{${laminar.manifest.run}}}, exited with code {{${code}}}`);
        process.exit(code);
      });
  }

};

export default laminar;
