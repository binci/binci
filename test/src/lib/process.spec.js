/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import proc from './../../../src/lib/process';

describe('process', () => {
  it('resolves when a process is successful', (done) => {
    proc('ls', [ '-l'])
      .then(() => done())
      .catch((code) => done(code));
  });
  it('rejects when a process fails', (done) => {
    proc('ls', [ '-Y' ])
      .catch(() => {
        done();
      });
  });
});
