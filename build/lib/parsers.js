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
  }
};

exports['default'] = parsers;
module.exports = exports['default'];