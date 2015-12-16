/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import proc from './process';
import { exec } from 'child_process';
import Promise from 'bluebird';
import output from './output';
import parsers from './parsers';

export const services = {
  // Placeholder for links
  links: [],
  // Services which should not be persisted
  noPersist: [],
  /**
   * Breaks up service entry into object containing args
   * @param {Object} svc The service/link entry
   * @returns {Array}
   */
  getArgs: svc => {
    const env = svc.env ? parsers.parseEnvVars(svc.env) : [];
    const ports = svc.expose ? parsers.parseExpose(svc.expose) : [];
    let args = [];
    args = env.length ? args.concat(env) : args;
    args = ports.length ? args.concat(ports) : args;
    args = args.concat([ '--name', svc.name ]);
    args = args.concat([ svc.image ]);
    return args;
  },

  /**
   * Runs exec task for a service
   * @param {Object} svc The service object
   * @returns {Object} promise
   */
  execSvcTask: svc => {
    return new Promise((resolve, reject) => {
      if (svc.exec) {
        const toExec = parsers.parseTask(svc.exec).trim();
        output.success(`Running service exec {{${toExec}}}`);
        proc('docker', [ 'exec', '-t', svc.name, 'sh', '-c', toExec ])
          .then(resolve)
          .catch(reject);
      } else {
        resolve();
      }
    });
  },

  /**
   * Checks if service is running, if not starts it
   * @param {Object} svc The service object
   * @returns {Object} promise
   */
  startSvc: svc => {
    return new Promise((resolve, reject) => {
      // Check if service is running
      exec(`docker ps -f name=${svc.name} -q`, (err, stdout) => {
        // Error on check
        if (err) return reject(err);
        // Running; resolve
        if (stdout.length) return resolve();
        // Not running; start
        output.success(`Starting service {{${svc.name}}}`);
        // Build arguments
        const args = [ 'run', '-d', '--privileged' ].concat(services.getArgs(svc));
        // Start service
        resolve(proc('docker', args));
      });
    }).then(() => services.execSvcTask(svc));
  },
  /**
   * Checks for non-persists services and (get this...) STOPS THEM.
   * @returns {Object} promise
   */
  stopServices: () => {
    return new Promise(resolve => {
      if (!services.noPersist.length) return resolve();
      output.success(`Stoping service${ services.noPersist.length > 1 ? 's' : '' }: {{${services.noPersist.join(', ')}}}`);
      const command = services.noPersist.reduce((cmd, name, i) => {
        return cmd + `${i > 0 ? ' && ' : ''}docker stop ${name} && docker ` +
        (process.env.DEVLAB_NO_RM ? `rename ${name} ${name + Date.now()}` : `rm ${name}`);
      }, '');
      exec(command, err => {
        if (err) output.warn('Could not stop all services');
        // Always resolve
        resolve();
      });
    });
  },
  /**
   * Iterates over services array and starts non-running service containers
   * @param {Array} services The array of services to link
   * @returns {Object} promise
   */
  run: serviceArray => {
    return new Promise((resolve, reject) => {
      // Incrementor
      let i = 0;
      const links = [];
      // Service check/start
      const startSvc = service => {
        const svc = parsers.parseSvcObj(service);
        // Don't persist?
        if (!svc.persist) services.noPersist.push(svc.name);
        // Push to service links
        services.links.push(svc.name);
        // Push to resolve links
        links.push(`${svc.name}:${svc.alias}`);
        // Check service
        services.startSvc(svc)
          .then(() => {
            output.success(`Service {{${svc.name}}} running`);
            // Check next incremet
            i++;
            if (serviceArray[i]) {
              // Recurse
              startSvc(serviceArray[i]);
            } else {
              // Done.
              resolve(links);
            }
          })
          .catch(code => {
            output.error(`Failed to start {{${svc.name}}}`);
            reject(code);
          });
      };
      // Kick off recursion over services
      startSvc(serviceArray[i]);
    });
  }
};

module.exports = services;
