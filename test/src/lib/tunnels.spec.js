/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import tunnels from './../../../src/lib/tunnels';
import cp from 'child_process';

let stub = null;

describe.only('tunnels', () => {
  afterEach(() => {
    if (stub) {
      stub.restore();
      stub = null;
    }
    tunnels._tunnelProc = null;
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
