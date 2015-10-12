/*
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _libConfig = require('./lib/config');

var _libConfig2 = _interopRequireDefault(_libConfig);

var _libServices = require('./lib/services');

var _libServices2 = _interopRequireDefault(_libServices);

var _libProcess = require('./lib/process');

var _libProcess2 = _interopRequireDefault(_libProcess);

var _libOutput = require('./lib/output');

var _libOutput2 = _interopRequireDefault(_libOutput);

var _libParsers = require('./lib/parsers');

var _libParsers2 = _interopRequireDefault(_libParsers);

// Process timer
var start = new Date().getTime();

var core = {

  // Service links placeholder
  links: [],

  // Create run-time manifest from config
  manifest: null,

  /**
   * Builds command arguments for executing task
   * @returns {String} The command to execute the task
   */
  buildArgs: function buildArgs() {
    var env = core.manifest.env ? _libParsers2['default'].parseEnvVars(core.manifest.env) : [];
    var ports = core.manifest.expose ? _libParsers2['default'].parseExpose(core.manifest.expose) : [];
    var volumes = core.manifest.volumes ? _libParsers2['default'].parseVolumes(core.manifest.volumes) : [];
    // Spawn arguments
    var mode = core.manifest.interactive || process.stdout.isTTY ? '-it' : '-t';
    var args = ['run', '--privileged', mode, '--rm'];
    // Workdir config
    var workdir = ['-v', core.manifest.workdir + ':' + core.manifest.workdir, '-w', core.manifest.workdir];
    // From (image) config
    var from = [core.manifest.from];
    // Split command into (space delimited) parts
    var cmd = ['sh', '-c', core.manifest.run];
    // Build full args array
    args = core.links.length ? args.concat(core.links) : args;
    args = env.length ? args.concat(env) : args;
    args = ports.length ? args.concat(ports) : args;
    args = volumes.length ? args.concat(volumes) : args;
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
  startServices: function startServices(svc) {
    return new _bluebird2['default'](function (resolve, reject) {
      if (!svc) {
        resolve();
      } else {
        (function () {
          var svcNames = [];
          svc.forEach(function (s) {
            var tmp = _libParsers2['default'].parseSvcObj(s);
            svcNames.push(tmp.name);
          });
          _libOutput2['default'].success('Starting service' + (svcNames.length > 1 ? 's' : '') + ': {{' + svcNames.join(', ') + '}}');
          _libServices2['default'].run(svc).then(function (links) {
            // Create links array for insert into run
            links.map(function (l) {
              core.links = core.links.concat(['--link', l]);
            });
            resolve();
          })['catch'](function (e) {
            _libOutput2['default'].error(e);
            reject(1);
          });
        })();
      }
    });
  },

  /**
   * Executes the task with arguments
   * @param {Array} args Array of arguments
   * @returns {Object} promise
   */
  execTask: function execTask(args) {
    _libOutput2['default'].success('Running container {{' + core.manifest.from + '}}, task {{' + core.manifest.run + '}}');
    return (0, _libProcess2['default'])('docker', args);
  },

  /**
   * Runs the execution chain to carry out task
   */
  run: function run() {
    core.manifest = _libConfig2['default'].get();
    core.startServices(core.manifest.services).then(core.buildArgs).then(core.execTask).then(_libServices2['default'].stopServices).then(function () {
      var closed = (new Date().getTime() - start) / 1000;
      _libOutput2['default'].success('Completed in {{' + closed + '}} seconds');
      process.exit(0);
    })['catch'](function (code) {
      _libOutput2['default'].error('Error running {{' + core.manifest.run + '}}, exited with code {{' + code + '}}');
      process.exit(code);
    });
  }

};

exports['default'] = core;
module.exports = exports['default'];