/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import forwarders from './../../../src/lib/forwarders';
import dgram from 'dgram';
import net from 'net';
import Promise from 'bluebird';

let server = null;

const listenProm = (serv, port) => {
  return new Promise((resolve, reject) => {
    serv.on('error', reject);
    if (serv.listen) {
      serv.listen(port, resolve);
    } else {
      serv.bind(port, resolve);
    }
  });
};

describe.only('forwarders', () => {
  afterEach((done) => {
    forwarders.stopForwarders();
    if (server) {
      server.close(done);
      server = null;
    } else {
      done();
    }
  });
  describe('startTcpForwarder', () => {
    it('locally proxies TCP port 54328 to 54329', (done) => {
      server = net.createServer((conn) => conn.pipe(conn));
      listenProm(server, 54329).then(() => {
        return forwarders.startTcpForwarder('localhost', 54328, 54329);
      }).then(() => {
        const client = net.connect(54328, () => {
          client.on('data', (str) => {
            expect(str).to.equal('foo');
            client.on('end', done);
            client.end();
          });
          client.write('foo');
          client.on('error', done);
        });
        client.setEncoding('utf8');
      }).catch(done);
    });
  });
  describe('startUdpForwarder', () => {
    it('locally proxies UDP port 54328 to 54329', (done) => {
      server = dgram.createSocket('udp4');
      listenProm(server, 54329).then(() => {
        return forwarders.startUdpForwarder('localhost', 54328, 54329);
      }).then(() => {
        const msg = new Buffer('foo');
        server.send(msg, 0, msg.length, 54328, 'localhost', (err) => {
          if (err) done(err);
        });
        server.on('message', (buf) => {
          expect(buf.toString()).to.equal(msg.toString());
          done();
        });
      }).catch(done);
    });
  });
  describe('stopForwarders', () => {
    it('does not error when no forwarders are active', () => {
      forwarders.stopForwarders();
    });
    it('kills active forwarder process', (done) => {
      server = net.createServer((conn) => conn.pipe(conn));
      listenProm(server, 54329).then(() => {
        return forwarders.startForwarder('localhost', 54328, 54329);
      }).then(() => {
        forwarders.stopForwarders();
        setTimeout(() => {
          const client = net.connect(54328, () => {
            client.on('end', () => {
              done(new Error('should not have connected'));
            });
            client.end();
          });
          client.on('error', (err) => {
            expect(err).to.exist;
            expect(err).to.have.property('code').equal('ECONNREFUSED');
            done();
          });
        }, 100);
      }).catch(done);
    });
  });
});
