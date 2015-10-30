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
      process.env.DEVLAB_NO_RM = false;
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
        '--name',
        'devlab_test_undefined',
        'node:0.10',
        'sh',
        '-c',
        'test'
      ]);
    });
    it('builds arguments from manifest file, runs with no -rm with DEVLAN_NO_RM set', () => {
      process.env.DEVLAB_NO_RM = true;
      const result = core.buildArgs();
      expect(result).to.deep.equal([
        'run',
        '--privileged',
        '-it',
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
        '--name',
        'devlab_test_undefined',
        'node:0.10',
        'sh',
        '-c',
        'test'
      ]);
    });
  });
});
