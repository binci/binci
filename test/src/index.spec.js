/* global sinon, expect, request, describe, it, before, after */
import './../setup';
process.env.LAM_TEST = true;
import laminar from './../../src/index';

describe('laminar', () => {
  describe('parseEnvVars', () => {
    it('processes an array of env vars and returns arguments', () => {
      const result = laminar.parseEnvVars([ 'FOO=bar', 'LAM_TEST=${LAM_TEST}' ]);
      expect(result).to.deep.equal([ '-e', 'FOO=bar', '-e', 'LAM_TEST=true' ]);
    });
  });
  describe('parseExpose', () => {
    it('processes an array of ports and returns arguments', () => {
      const result = laminar.parseExpose([ '8080:8080' ]);
      expect(result).to.deep.equal([ '-p', '8080:8080' ]);
    })
  })
});
