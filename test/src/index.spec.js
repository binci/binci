/* global sinon, expect, request, describe, it, before, after */
import './../setup';
import core from './../../src/index';
import yaml from 'js-yaml';
import fs from 'fs';

describe('core', () => {
  describe('buildArgs', () => {
    // Set test properties
    core.manifest = yaml.safeLoad(fs.readFileSync('./test/project/devlab.yml', 'utf8'));
    core.manifest.run = 'test';
    core.manifest.workdir = '/test';
    core.links = [ '--link', 'someService:someService' ];
    it('builds arguments from manifest file', () => {
      const result = core.buildArgs();
      expect(result).to.deep.equal([
        'run',
        '--privileged',
        '-it',
        '--rm',
        '--link',
        'someService:someService',
        '-e',
        `LOCAL_HOME=${process.env.HOME}`,
        '-p',
        '8080:8080',
        '-v',
        `${process.env.HOME}/.ssh:/root/.ssh`,
        '-v',
        '/test:/test',
        '-w',
        '/test',
        'node:0.10',
        'sh',
        '-c',
        'test'
      ]);
    });
  });
});
