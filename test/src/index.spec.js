/* global sinon, expect, request, describe, it, before, after */
import './../setup';
import laminar from './../../src/index';
import yaml from 'js-yaml';
import fs from 'fs';

describe('laminar', () => {
  describe('buildArgs', () => {
    // Set test properties
    laminar.manifest = yaml.safeLoad(fs.readFileSync('./test/project/laminar.yml', 'utf8'));
    laminar.manifest.run = 'test';
    laminar.manifest.volume = '/test';
    laminar.links = [ '--link', 'someService:someService' ];
    it('builds arguments from manifest file', () => {
      const result = laminar.buildArgs();
      expect(result).to.deep.equal([
        'run',
        '-t',
        '--rm',
        '--link',
        'someService:someService',
        '-e',
        'LOCAL_HOME=/home/fluidbyte',
        '-p',
        '8080:8080',
        '-v',
        '/test:/test',
        '-w',
        '/test',
        'node:0.10',
        'bash',
        '-c',
        'test'
      ]);
    });
  });
});
