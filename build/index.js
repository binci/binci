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

var laminar = {

  // Service links placeholder
  links: [],

  // Create run-time manifest from config
  manifest: null,

  /**
   * Builds command arguments for executing task
   * @returns {String} The command to execute the task
   */
  buildArgs: function buildArgs() {
    var env = laminar.manifest.env ? _libParsers2['default'].parseEnvVars(laminar.manifest.env) : [];
    var ports = laminar.manifest.expose ? _libParsers2['default'].parseExpose(laminar.manifest.expose) : [];
    // Spawn arguments
    var args = ['run', '-t', '--rm'];
    // Volume config
    var volume = ['-v', laminar.manifest.volume + ':' + laminar.manifest.volume];
    // Workdir config
    var workdir = ['-w', laminar.manifest.volume];
    // From (image) config
    var from = [laminar.manifest.from];
    // Split command into (space delimited) parts
    var cmd = ['bash', '-c', laminar.manifest.run];
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
  startServices: function startServices(svc) {
    return new _bluebird2['default'](function (resolve, reject) {
      if (!svc) {
        resolve();
      } else {
        (function () {
          var svcNames = [];
          svc.forEach(function (s) {
            svcNames.push(Object.keys(s)[0]);
          });
          _libOutput2['default'].success('Starting service' + (svcNames.length > 1 ? 's' : '') + ': {{' + svcNames.join(', ') + '}}');
          _libServices2['default'].run(svc).then(function (links) {
            // Create links array for insert into run
            links.map(function (l) {
              laminar.links = laminar.links.concat(['--link', l]);
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
    _libOutput2['default'].success('Running container {{' + laminar.manifest.from + '}}, task {{' + laminar.manifest.run + '}}');
    return (0, _libProcess2['default'])('docker', args);
  },

  /**
   * Runs the execution chain to carry out task
   */
  run: function run() {
    laminar.manifest = _libConfig2['default'].get();
    laminar.startServices(laminar.manifest.services).then(laminar.buildArgs).then(laminar.execTask).then(_libServices2['default'].stopServices).then(function () {
      var closed = (new Date().getTime() - start) / 1000;
      _libOutput2['default'].success('Completed in {{' + closed + '}} seconds');
      process.exit(0);
    })['catch'](function (code) {
      _libOutput2['default'].error('Error running {{' + laminar.manifest.run + '}}, exited with code {{' + code + '}}');
      process.exit(code);
    });
  }

};

exports['default'] = laminar;
module.exports = exports['default'];