/*
 * Copyright (c) 2015 TechnologyAdvice
 */
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

var _parsers = require('./parsers');

var _parsers2 = _interopRequireDefault(_parsers);

var bindIp = '127.0.0.1';

var tunnelProc = null;

/*
ssh -N \
  -i ${HOME}/.docker/machine/machines/${DOCKER_MACHINE_NAME}/id_rsa \
  docker@`docker-machine ip $DOCKER_MACHINE_NAME` \
  -L 8181:127.0.0.1:8181
*/
var tunnels = {
  startTunnels: function startTunnels(host, ports) {
    var keyPath = tunnels._getKeyPath();
    var remoteUser = tunnels._getRemoteUser();
    var args = ['-N'];
    if (keyPath) {
      args.push('-i', keyPath);
    }
    var userStr = remoteUser ? remoteUser + '@' : '';
    args.push(userStr + host);
    ports.forEach(function (port) {
      return args.push('-L', port + ':' + bindIp + ':' + port);
    });
    tunnelProc = (0, _child_process.spawn)('ssh', args, {
      stdio: ['ignore', 'ignore', process.stderr]
    });
    tunnelProc.on('close', function () {
      return tunnelProc = null;
    });
  },

  stopTunnels: function stopTunnels() {
    if (tunnelProc) {
      tunnelProc.kill();
    }
  },

  _getKeyPath: function _getKeyPath() {
    if (process.env.DEVLAB_FORWARD_SSH_KEY) {
      return process.env.DEVLAB_FORWARD_SSH_KEY;
    }
    if (process.env.DOCKER_MACHINE_NAME) {
      return process.env.HOME + '/.docker/machine/machines/' + process.env.DOCKER_MACHINE_NAME + '/id_rsa';
    }
    return null;
  },

  _getRemoteUser: function _getRemoteUser() {
    return process.env.DEVLAB_FORWARD_SSH_USER || (process.env.DOCKER_MACHINE_NAME ? 'docker' : null);
  }
};

exports['default'] = tunnels;
module.exports = exports['default'];