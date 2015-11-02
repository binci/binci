/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import output from './output';
import net from 'net';
import Promise from 'bluebird';

const forwarders = {
  /**
   * Opens a server socket on the given port, proxying it to the same port at the given host when a connection is
   * established.
   * @param {string} host The hostname or IP address of the remote server
   * @param {number} localPort The port on which to listen for local connections
   * @param {number} [remotePort=localPort] The port to which traffic should be forwarded on the host. If omitted,
   *    localPort is used.
   * @return {Promise} Resolves when the given localPort is successfully listening.
   */
  startForwarder: (host, localPort, remotePort = localPort) => {
    const server = net.createServer((localConn) => {
      const remoteConn = net.connect(remotePort, host);
      remoteConn.on('connect', () => {
        localConn.pipe(remoteConn);
        remoteConn.pipe(localConn);
      });
      remoteConn.on('error', (err) => {
        output.error(err.message);
        localConn.end();
      });
    });
    output.success(`Forwarding {{localhost:${localPort}}} to {{${host}:${remotePort}}}`);
    forwarders._servers.push(server);
    return new Promise((resolve, reject) => {
      server.on('error', (err) => reject(err));
      server.listen(localPort, resolve);
    });
  },

  /**
   * Starts a forwarder for each given port on the local machine to the same ports on the remote machine.
   * @param {string} host The hostname of the machine to which the ports should be forwarded.
   * @param {Array<number>} ports An array of port numbers to forward
   * @return {Promise} Resolves when all given ports are listening locally.
   */
  startForwarders: (host, ports) => {
    const promises = ports.map((port) => forwarders.startForwarder(host, port));
    return Promise.all(promises);
  },

  /**
   * Stops any active forwarders. If no forwarders are active, this does nothing.
   */
  stopForwarders: () => {
    if (forwarders._servers.length) {
      output.success('Halting all port forwarding');
      forwarders._servers.forEach((server) => {
        server.unref();
        server.close();
      });
      forwarders._servers = [];
    }
  },

  /**
   * An array of server sockets
   */
  _servers: []
};

export default forwarders;
