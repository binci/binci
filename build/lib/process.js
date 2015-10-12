/*
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _child_process = require('child_process');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _output = require('./output');

var _output2 = _interopRequireDefault(_output);

// Test output supression
var stdio = _output2['default'].setStdio();

/**
 * Spawns a process and returns a promise for handling results
 * @param {String} proc The command/process to run
 * @param {Array} args The arguments of the proc command
 */

exports['default'] = function (proc, args) {
  _output2['default'].insertBreak();
  return new _bluebird2['default'](function (resolve, reject) {
    var p = (0, _child_process.spawn)(proc, args, {
      env: process.env,
      cwd: process.env.HOME,
      stdio: stdio
    });
    // Handle close
    p.on('close', function (code) {
      _output2['default'].insertBreak();
      if (code === 0 || code === 130) {
        resolve();
      } else {
        reject(code);
      }
    });
  });
};

module.exports = exports['default'];