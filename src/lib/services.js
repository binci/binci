import proc from './process';
import { exec } from 'child_process';
import Promise from 'bluebird';
import output from './output';

const services = {
  /**
   * Placeholder for links
   */
  links: [],
  /**
   * Parses the service object and ensures all required props set
   * @param {Object} svc The service object from the manifest
   * @returns {Object}
   */
  getSvcObj: (svc) => {
    const image = Object.keys(svc)[0];
    const name = svc[image].name || image;
    const env = svc[image].env || false;
    const persist = svc[image].persist || true;
    return { image, name, env, persist };
  },
  /**
   * Breaks up service entry into object containing args
   * @param {Object} svc The service/link entry
   * @returns {Object}
   */
  getArgs: (svc) => {
    let args = [];
    args = args.concat([ '--name', svc.name ])
    args = args.concat([ svc.image ]);
    return args;
  },
  /**
   * Checks if service is running, if not starts it
   * @param {Object} svc The service object
   * @returns {Object} promise
   */
  startSvc: (svc) => {
    return new Promise((resolve, reject) => {
      // Check if service is running
      exec(`docker ps -f name=${svc.name} -q`, (err, stdout) => {
        if (err) {
          // Error on check
          reject(err);
        } else if (!stdout.length) {
          // Not running; start
          output.success(`Starting service {{${svc.name}}}`);
          // Build arguments
          let args = [ 'run', '-d' ];
          args = args.concat(services.getArgs(svc));
          // Start service
          proc('docker', args)
            .then(resolve)
            .catch(reject);
        } else {
          // Running; resolve
          resolve();
        }
      });
    });
  },
  /**
   * Iterates over services array and starts non-running service containers
   * @param {Array} services The array of services to link
   * @returns {Object} promise
   */
  run: (serviceArray) => {
    return new Promise((resolve, reject) => {
      // Incrementor
      let i = 0;
      // Service check/start
      const startSvc = (service) => {
        const svc = services.getSvcObj(service);
        // Push to links
        services.links.push(svc.name);
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
              resolve(services.links);
            }
          })
          .catch((code) => {
            output.error(`Failed to start {{${svc.name}}}`);
            reject(code);
          });
      };
      // Kick off recursion over services
      startSvc(serviceArray[i]);
    });
  }
};

export default services;
