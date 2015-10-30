/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import { spawn } from 'child_process';

const bindIp = '127.0.0.1';

let tunnelProc = null;

const tunnels = {
  startTunnels: (host, ports) => {
    const keyPath = tunnels._getKeyPath();
    const remoteUser = tunnels._getRemoteUser();
    const args = ['-N'];
    if (keyPath) {
      args.push('-i', keyPath);
    }
    const userStr = remoteUser ? remoteUser + '@' : '';
    args.push(userStr + host);
    ports.forEach((port) => args.push('-L', `${port}:${bindIp}:${port}`));
    tunnelProc = spawn('ssh', args, {
      stdio: ['ignore', 'ignore', process.stderr]
    });
    tunnelProc.on('close', () => tunnelProc = null);
  },

  stopTunnels: () => {
    if (tunnelProc) {
      tunnelProc.kill();
    }
  },

  _getKeyPath: () => {
    if (process.env.DEVLAB_FORWARD_SSH_KEY) {
      return process.env.DEVLAB_FORWARD_SSH_KEY;
    }
    if (process.env.DOCKER_MACHINE_NAME) {
      return process.env.HOME + '/.docker/machine/machines/' + process.env.DOCKER_MACHINE_NAME + '/id_rsa';
    }
    return null;
  },

  _getRemoteUser: () => {
    return process.env.DEVLAB_FORWARD_SSH_USER || (process.env.DOCKER_MACHINE_NAME ? 'docker' : null);
  }
};

export default tunnels;
