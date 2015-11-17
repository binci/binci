/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import output from './output';
import dgram from 'dgram';
import net from 'net';
import Promise from 'bluebird';

const forwarders = {
  /**
   * Enables TCP connection and UDP packet forwarding to a remote host.
   * @param {string} host The hostname or IP address of the remote server
   * @param {number} localPort The port on which to listen for local connections
   * @param {number} [remotePort=localPort] The port to which traffic should be forwarded on the host. If omitted,
   *    localPort is used.
   * @return {Promise} Resolves when the given localPort is successfully listening for both TCP and UDP.
   */
  startForwarder: (host, localPort, remotePort = localPort) => {
    return Promise.all([
      forwarders.startTcpForwarder(host, localPort, remotePort),
      forwarders.startUdpForwarder(host, localPort, remotePort)
    ]);
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
   * Opens a TCP server socket on the given port, proxying it to the specified port at the given host
   * when a connection is established.
   * @param {string} host The hostname or IP address of the remote server
   * @param {number} localPort The port on which to listen for local connections
   * @param {number} [remotePort=localPort] The port to which traffic should be forwarded on the host.
   *    If omitted, localPort is used.
   * @return {Promise} Resolves when the given localPort is successfully listening.
   */
  startTcpForwarder: (host, localPort, remotePort = localPort) => {
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
    output.success(`Forwarding {{localhost:${localPort}}} to {{${host}:${remotePort}}} over TCP`);
    forwarders._servers.push(server);
    return new Promise((resolve, reject) => {
      server.on('error', (err) => reject(err));
      server.listen(localPort, resolve);
    });
  },

  /**
   * Opens a UDP listening socket on the given port, proxying any messages it receives to the specified
   * port at the given host.
   * @param {string} host The hostname or IP address of the remote server
   * @param {number} localPort The port on which to listen for local connections
   * @param {number} [remotePort=localPort] The port to which traffic should be forwarded on the host.
   *    If omitted, localPort is used.
   * @param {string} [type='udp4'] The UDP message type to support
   * @return {Promise} Resolves when the given localPort is successfully listening.
   */
  startUdpForwarder: (host, localPort, remotePort = localPort, type = 'udp4') => {
    const socket = dgram.createSocket(type);
    socket.on('message', (msg) => {
      socket.send(msg, 0, msg.length, remotePort, host);
    });
    forwarders._servers.push(socket);
    output.success(`Forwarding {{localhost:${localPort}}} to {{${host}:${remotePort}}} over UDP`);
    return new Promise((resolve, reject) => {
      try {
        socket.bind(localPort);
      } catch (e) {
        reject(e);
      }
      resolve();
    });
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
