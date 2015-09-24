import process from './process';
import { exec } from 'child_process';
import Promise from 'bluebird';
import output from './output';

/**
 * Breaks up service entry into name and image
 */
const serviceObj = (svc) => {
  const s = svc.split(':');
  return {
    name: s[0],
    image: s.length > 1 ? s[1] : s[0]
  };
};

/**
 * Checks if service is running, if not starts it
 */
const checkSvc = (svc) => {
  return new Promise((resolve, reject) => {
    // Check if service is running
    exec(`docker ps -f name=${svc.name} -q`, (err, stdout) => {
      if (err) {
        // Error on check
        reject(err);
      } else if (!stdout.length) {
        // Not running; start
        output.success(`Starting service {{${svc.name}}}`);
        process('docker', [ 'run', '-d', '--name', svc.name, svc.image])
          .then(resolve).catch(reject);
      } else {
        // Running; resolve
        resolve();
      }
    });
  });
};

/**
 * Iterates over services array and starts non-running service containers
 */
const runServices = (services) => {
  return new Promise((resolve, reject) => {
    // Incrementor
    let i = 0;
    // Service check/start
    const startSvc = (service) => {
      // Parse service object
      const svc = serviceObj(service);
      // Check service
      checkSvc(svc)
        .then(() => {
          output.success(`Service {{${svc.name}}} running`);
          // Check next incremet
          i++;
          if (services[i]) {
            // Recurse
            startSvc(services[i]);
          } else {
            // Done.
            resolve();
          }
        })
        .catch(() => {
          output.error(`Failed to start {{${svc.name}}}`);
          reject();
        });
    };
    // Kick off recursion over services
    startSvc(services[i]);
  });
};

export default runServices;
