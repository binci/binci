/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import output from './output';
import net from 'net';

const forwarders = {
  /**
   * Opens a server socket on the given port, proxying it to the same port at the given host when a connection is
   * established.
   * @param {string} host The hostname or IP address of the remote server
   * @param {number} port The port to connect between local and remote
   */
  startForwarder: (host, port) => {
    const server = net.createServer((localConn) => {
      const remoteConn = net.connect(port, host);
      remoteConn.on('connect', () => {
        localConn.pipe(remoteConn);
        remoteConn.pipe(localConn);
      });
      remoteConn.on('error', (err) => {
        output.error(err.message);
        localConn.end();
      });
    });
    output.success(`Forwarding {{localhost:${port}}} to {{${host}:${port}}}`);
    server.listen(port);
    forwarders._servers.push(server);
  },

  /**
   * Starts a forwarder for each given port on the local machine to the same ports on the remote machine.
   * @param {string} host The hostname of the machine to which the ports should be forwarded.
   * @param {Array<number>} ports An array of port numbers to forward
   */
  startForwarders: (host, ports) => {
    ports.forEach((port) => forwarders.startForwarder(host, port));
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
