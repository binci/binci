import config from './config';
import username from 'username';
import _ from 'lodash';
/*
 * Copyright (c) 2015 TechnologyAdvice
 */
const parsers = {
  /**
   * Parses host environment variables
   * @param {String} str The string to parse
   * @returns {String}
   */
  parseHostEnvVars: str => {
    // Matches any ${VAR} format vars
    const matcher = (i, match) =>  process.env.hasOwnProperty(match) ? process.env[match] : null;
    // Replace matches on ${VAR}
    return str.toString().replace(/\$\{([^}]+)\}/g, matcher);
  },

  /**
   * Parse /etc/hosts mappings
   * @param {Object} map A mapping of hostname to IP address
   * @returns {Array} an array of Docker arguments to set up the host maps.
   */
  parseHostMap: map => {
    const args = [];
    _.forOwn(map, (val, key) => {
      args.push('--add-host');
      args.push(`${key}:${val}`);
    });
    return args;
  },

  /**
   * Process environment variables
   * @param {Array} env Array of environment variables
   * @returns {Array} env var flags and args
   */
  parseEnvVars: env => {
    return env.reduce((envs, e) => { return envs.concat([ '-e', parsers.parseHostEnvVars(e) ]); }, []);
  },

  /**
   * Process any ports to expose
   * @param {Array} expose Array of ports to expose
   * @returns {Array} port expose flags and args
   */
  parseExpose: (expose) => {
    return expose.reduce((ports, p)=> { return ports.concat([ '-p', p ]); }, []);
  },

  /**
   * Scans the manifest for any exposed ports with `forward` not set to `false` at the same level.
   * @param {Object} manifest A parsed devlab manifest
   * @returns {Array<string>} An array of ports exposed on the host machine, in string form.
   */
  parseForwardedPorts: manifest => {
    let serviceBlocks = [manifest];
    if (manifest.services) {
      serviceBlocks = serviceBlocks.concat(_.values(manifest.services));
    }
    return serviceBlocks
      .filter(elem => elem.forward !== false && elem.expose && elem.expose.length)
      .map(elem => elem.expose)
      .reduce((ports, elem) => {
        return elem.reduce((elemPorts, expose) => {
          const portMatch = expose.match(/^(\d+):/);
          if (portMatch && portMatch[1]) elemPorts.push(parseInt(portMatch[1], 10));
          return elemPorts;
        }, ports);
      }, []);
  },

  /**
   * Process any volumes to map
   * @param {Array} volumes Array of volumes to map
   * @returns {Array} volume map flags and args
   */
  parseVolumes: (volumes) => {
    return volumes.reduce((vols, v) => { return vols.concat([ '-v', parsers.parseHostEnvVars(v) ]); }, []);
  },
  /**
   * Parses the service container name
   * @param {String} name
   * @returns {String}
   */
  parseSvcObjName: (name, persist) => {
    let user = username.sync() || 'unknown';
    const uid = !persist ? `_${config.instance}` : '';
    return `devlab_${name}_${user}${uid}`.toLowerCase().replace(/[^A-Z0-9]/ig, '_');
  },
  /**
   * Parses the service object and ensures all required props set
   * @param {Object} svc The service object from the manifest
   * @returns {Object}
   */
  parseSvcObj: (svc) => {
    const image = Object.keys(svc)[0];
    const name = parsers.parseSvcObjName(svc[image].name || image, svc[image].persist);
    const alias = svc[image].name || image;
    const env = svc[image].env || false;
    const expose = svc[image].expose || false;
    const persist = svc[image].persist === false ? false : true;
    // Return svc object
    return { image, name, alias, env, expose, persist };
  },
  /**
   * Strips line breaks and splits with semicolons
   * @param {String} task The task to parse
   * @returns {String}
   */
  parseTask: task => {
    if (task && task.indexOf('\n') >= 0) {
      return task.split('\n').join('; ');
    }
    return task;
  },
  /**
   * Parses aliases to other tasks
   * @param {Object} manifest The config manifest
   * @param {String} task The task
   * @returns {String}
   */
  parseAliases: (manifest, task) => {
    const matchAliases = (i, match) => {
      if (manifest.tasks[match]) {
        return manifest.tasks[match] + ';';
      }
      return '.' + match;
    };
    return parsers.parseTask(task.toString().replace(/\.(\S+)\b/g, matchAliases));
  }
};

export default parsers;
