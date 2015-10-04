/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import parsers from './../../../src/lib/parsers';

describe('parsers', () => {
  describe('parseEnvVars', () => {
    it('processes an array of env vars and returns arguments', () => {
      const result = parsers.parseEnvVars([ 'FOO=bar', 'LAM_TEST=${LAM_TEST}' ]);
      expect(result).to.deep.equal([ '-e', 'FOO=bar', '-e', 'LAM_TEST=true' ]);
    });
  });
  describe('parseExpose', () => {
    it('processes an array of ports and returns arguments', () => {
      const result = parsers.parseExpose([ '8080:8080' ]);
      expect(result).to.deep.equal([ '-p', '8080:8080' ]);
    });
  });
});
