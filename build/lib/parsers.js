'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var parsers = {
  /**
   * Process environment variables
   * @param {Array} env Array of environment variables
   * @returns {Array} env var flags and args
   */
  parseEnvVars: function parseEnvVars(env) {
    var envs = [];
    env.map(function (e) {
      // Matches any ${VAR} format vars
      var matcher = function matcher(i, match) {
        return process.env.hasOwnProperty(match) ? process.env[match] : null;
      };
      // Replace matches on ${VAR}
      var envVar = e.toString().replace(/\$\{([^}]+)\}/g, matcher);
      // Concat
      envs = envs.concat(['-e', envVar]);
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
  }
};

exports['default'] = parsers;
module.exports = exports['default'];