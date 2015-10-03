'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _process = require('./process');

var _process2 = _interopRequireDefault(_process);

var _child_process = require('child_process');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _output = require('./output');

var _output2 = _interopRequireDefault(_output);

var services = {
  /**
   * Breaks up service entry into name and image
   * @param {String} svc The service/link entry
   * @returns {Object}
   */
  getObj: function getObj(svc) {
    var s = svc.split(':');
    return {
      name: s[0],
      image: s.length > 1 ? s[1] : s[0]
    };
  },
  /**
   * Checks if service is running, if not starts it
   * @param {Object} svc The service object
   * @returns {Object} promise
   */
  startSvc: function startSvc(svc) {
    return new _bluebird2['default'](function (resolve, reject) {
      // Check if service is running
      (0, _child_process.exec)('docker ps -f name=' + svc.name + ' -q', function (err, stdout) {
        if (err) {
          // Error on check
          reject(err);
        } else if (!stdout.length) {
          // Not running; start
          _output2['default'].success('Starting service {{' + svc.name + '}}');
          (0, _process2['default'])('docker', ['run', '-d', '--name', svc.name, svc.image]).then(resolve)['catch'](reject);
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
  run: function run(serviceArray) {
    return new _bluebird2['default'](function (resolve, reject) {
      // Incrementor
      var i = 0;
      // Service check/start
      var startSvc = function startSvc(service) {
        // Parse service object
        var svc = services.getObj(service);
        // Check service
        services.startSvc(svc).then(function () {
          _output2['default'].success('Service {{' + svc.name + '}} running');
          // Check next incremet
          i++;
          if (serviceArray[i]) {
            // Recurse
            startSvc(serviceArray[i]);
          } else {
            // Done.
            resolve();
          }
        })['catch'](function () {
          _output2['default'].error('Failed to start {{' + svc.name + '}}');
          reject();
        });
      };
      // Kick off recursion over services
      startSvc(serviceArray[i]);
    });
  }
};

exports['default'] = services;
module.exports = exports['default'];