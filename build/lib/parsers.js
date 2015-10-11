'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var parsers = {
  /**
   * Parses host environment variables
   * @param {String} str The string to parse
   * @returns {String}
   */
  parseHostEnvVars: function parseHostEnvVars(str) {
    // Matches any ${VAR} format vars
    var matcher = function matcher(i, match) {
      return process.env.hasOwnProperty(match) ? process.env[match] : null;
    };
    // Replace matches on ${VAR}
    return str.toString().replace(/\$\{([^}]+)\}/g, matcher);
  },
  /**
   * Process environment variables
   * @param {Array} env Array of environment variables
   * @returns {Array} env var flags and args
   */
  parseEnvVars: function parseEnvVars(env) {
    var envs = [];
    env.map(function (e) {
      envs = envs.concat(['-e', parsers.parseHostEnvVars(e)]);
    });
    return envs;
  },

  /**
   * Process any ports to expose
   * @param {Array} expose Array of ports to expose
   * @returns {Array} port expose flags and args
   */
  parseExpose: function parseExpose(expose) {
    var ports = [];
    expose.map(function (p) {
      ports = ports.concat(['-p', p]);
    });
    return ports;
  },

  /**
   * Process any volumes to map
   * @param {Array} volumes Array of volumes to map
   * @returns {Array} volume map flags and args
   */
  parseVolumes: function parseVolumes(volumes) {
    var vols = [];
    volumes.map(function (v) {
      vols = vols.concat(['-v', parsers.parseHostEnvVars(v)]);
    });
    return vols;
  },
  /**
   * Parses the service object and ensures all required props set
   * @param {Object} svc The service object from the manifest
   * @returns {Object}
   */
  parseSvcObj: function parseSvcObj(svc) {
    var image = Object.keys(svc)[0];
    var name = svc[image].name || image;
    var env = svc[image].env || false;
    var expose = svc[image].expose || false;
    var persist = svc.hasOwnProperty('persist') && svc.persist === false ? false : true;
    // Return svc object
    return { image: image, name: name, env: env, expose: expose, persist: persist };
  },
  /**
   * Strips line breaks and splits with semicolons
   * @param {String} task The task to parse
   * @returns {String}
   */
  parseTask: function parseTask(task) {
    var tmp = task.replace(/(\r\n|\n|\r)/gm, ';');
    if (tmp.slice(-1) !== ';') tmp += ';';
    return tmp;
  }
};

exports['default'] = parsers;
module.exports = exports['default'];