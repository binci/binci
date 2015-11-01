/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import _ from 'lodash';
import tunnels from './../../../src/lib/tunnels';
import cp from 'child_process';

let stub = null;
let originalEnv = _.clone(process.env);

describe('tunnels', () => {
  afterEach(() => {
    if (stub) {
      stub.restore();
      stub = null;
    }
    tunnels._tunnelProc = null;
    process.env = _.clone(originalEnv);
  });
  describe('startTunnels', () => {
    it('starts tunnels over ssh', (done) => {
      stub = sinon.stub(cp, 'spawn', (cmd) => {
        expect(cmd).to.equal('ssh');
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1000]);
    });
    it('starts tunnels for each port', (done) => {
      stub = sinon.stub(cp, 'spawn', (cmd, args) => {
        expect(args).to.be.an.Array;
        let argStr = args.join(' ');
        expect(argStr).to.match(/\s-L 1:[^: ]+:1\b/);
        expect(argStr).to.match(/\s-L 2:[^: ]+:2\b/);
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1, 2]);
    });
    it('starts tunnels for the appropriate host', (done) => {
      stub = sinon.stub(cp, 'spawn', (cmd, args) => {
        expect(args).to.be.an.Array;
        let argStr = args.join(' ');
        expect(argStr).to.match(/\bsomehost\b/);
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1, 2]);
    });
    it('uses the docker user for docker-machine instances', (done) => {
      delete process.env.DEVLAB_FORWARD_SSH_USER;
      process.env.DOCKER_MACHINE_NAME = 'default';
      stub = sinon.stub(cp, 'spawn', (cmd, args) => {
        expect(args).to.be.an.Array;
        let argStr = args.join(' ');
        expect(argStr).to.match(/\bdocker@\S+/);
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1, 2]);
    });
    it('uses the configured user override', (done) => {
      process.env.DEVLAB_FORWARD_SSH_USER = 'foo';
      process.env.DOCKER_MACHINE_NAME = 'default';
      stub = sinon.stub(cp, 'spawn', (cmd, args) => {
        expect(args).to.be.an.Array;
        let argStr = args.join(' ');
        expect(argStr).to.match(/\bfoo@\S+/);
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1, 2]);
    });
    it('uses the local username in absence of any other config', (done) => {
      delete process.env.DEVLAB_FORWARD_SSH_USER;
      delete process.env.DOCKER_MACHINE_NAME;
      stub = sinon.stub(cp, 'spawn', (cmd, args) => {
        expect(args).to.be.an.Array;
        let argStr = args.join(' ');
        expect(argStr).to.not.match(/\S+@\S+/);
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1, 2]);
    });
    it('uses the default docker-machine key for docker-machine instances', (done) => {
      delete process.env.DEVLAB_FORWARD_SSH_KEY;
      process.env.DOCKER_MACHINE_NAME = 'default';
      stub = sinon.stub(cp, 'spawn', (cmd, args) => {
        expect(args).to.be.an.Array;
        let argStr = args.join(' ');
        expect(argStr).to.match(/-i\s\S+\/\.docker\/\S+/);
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1, 2]);
    });
    it('uses the configured ssh key override', (done) => {
      process.env.DEVLAB_FORWARD_SSH_KEY = '/tmp/key_rsa';
      process.env.DOCKER_MACHINE_NAME = 'default';
      stub = sinon.stub(cp, 'spawn', (cmd, args) => {
        expect(args).to.be.an.Array;
        let argStr = args.join(' ');
        expect(argStr).to.match(/-i\s\/tmp\/key_rsa\b/);
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1, 2]);
    });
    it('uses the local ssh key/agent in absence of any other config', (done) => {
      delete process.env.DEVLAB_FORWARD_SSH_KEY;
      delete process.env.DOCKER_MACHINE_NAME;
      stub = sinon.stub(cp, 'spawn', (cmd, args) => {
        expect(args).to.be.an.Array;
        let argStr = args.join(' ');
        expect(argStr).to.not.match(/-i\s/);
        done();
        return {on: () => {}};
      });
      tunnels.startTunnels('somehost', [1, 2]);
    });
  });
  describe('stopTunnels', () => {
    it('does not error when no tunnels are active', () => {
      tunnels.stopTunnels();
    });
    it('kills active tunnel process', (done) => {
      stub = sinon.stub(cp, 'spawn', () => {
        return {
          on: () => {},
          kill: () => done()
        };
      });
      tunnels.startTunnels('somehost', [1, 2]);
      tunnels.stopTunnels();
    });
  });
});
