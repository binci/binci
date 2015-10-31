/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import { spawn } from 'child_process';

/**
 * The IP to which forwarded ports should be bound. This is ssh's way of deriving the
 * network interface to be used, so 127.0.0.1 selects loopback.
 * @type {string}
 */
const bindIp = '127.0.0.1';

const tunnels = {
  /**
   * Starts tunnels from a port or ports on the local machine to the same ports on
   * the remote machine.
   * @param {string} host The hostname of the machine to which the ports should be forwarded.
   * @param {Array<string|number>} ports An array of ports numbers to forward
   */
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
    tunnels._tunnelProc = spawn('ssh', args, {
      stdio: ['ignore', 'ignore', process.stderr]
    });
    tunnels._tunnelProc.on('close', () => tunnelProc = null);
  },

  /**
   * Stops any active tunnels. If no tunnels are active, this does nothing.
   */
  stopTunnels: () => {
    if (tunnels._tunnelProc) {
      tunnels._tunnelProc.kill();
    }
  },

  /**
   * Gets the path to the ssh key to be used for the tunnel, if applicable.
   * @returns {string|null} The path to the key file to be used, or null to use the ssh default.
   * @private
   */
  _getKeyPath: () => {
    if (process.env.DEVLAB_FORWARD_SSH_KEY) {
      return process.env.DEVLAB_FORWARD_SSH_KEY;
    }
    if (process.env.DOCKER_MACHINE_NAME) {
      return process.env.HOME + '/.docker/machine/machines/' + process.env.DOCKER_MACHINE_NAME + '/id_rsa';
    }
    return null;
  },

  /**
   * Gets the name of the remote user to be used for the ssh connection, if applicable.
   * @returns {string|null} The remote user name, or null to use the ssh default.
   * @private
   */
  _getRemoteUser: () => {
    return process.env.DEVLAB_FORWARD_SSH_USER || (process.env.DOCKER_MACHINE_NAME ? 'docker' : null);
  },

  /**
   * The active tunnel process, or null if no process is active.
   */
  _tunnelProc: null
};

export default tunnels;
