/*
 * Copyright (c) 2015 TechnologyAdvice
 */
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
    var persist = svc[image].persist === false ? false : true;
    // Return svc object
    return { image: image, name: name, env: env, expose: expose, persist: persist };
  },
  /**
   * Strips line breaks and splits with semicolons
   * @param {String} task The task to parse
   * @returns {String}
   */
  parseTask: function parseTask(task) {
    if (task.indexOf('\n') >= 0) {
      var tmp = task.split('\n');
      return tmp.join('; ');
    }
    return task;
  },
  /**
   * Parses aliases to other tasks
   * @param {Object} manifest The config manifest
   * @param {String} task The task
   * @returns {String}
   */
  parseAliases: function parseAliases(manifest, task) {
    var matchAliases = function matchAliases(i, match) {
      return parsers.parseTask(manifest.tasks[match]) + ';';
    };
    return task.toString().replace(/\.(\S+)\b/g, matchAliases);
  }
};

exports['default'] = parsers;
module.exports = exports['default'];