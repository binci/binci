/* global sinon, exitSpy, logSpy, expect, log, describe, it, before, after */
import './../../setup';
import config from './../../../src/lib/config';

describe('config', () => {
  before(() => {
    // Override process.exit with return of code
    process.exit = (code) => code;
    global.exitSpy = sinon.spy(process, 'exit');
  });
  describe('cwd', () => {
    it('contains an absolute path representing the current directory', () => {
      expect(config.cwd.startsWith('/')).to.be.true;
    });
  });
  describe('args', () => {
    it('should return process arguments as an object', () => {
      expect(config.args).to.be.an.object;
    });
  });
  describe('checkArgs', () => {
    it('outputs help message if -h flag is passed', () => {
      config.checkArgs({ h: true });
      expect(exitSpy).to.be.calledWith(0);
      expect(logSpy).to.be.called;
    });
    it('outputs version if -v flag is passed', () => {
      config.checkArgs({ v: true });
      expect(global.exitSpy).to.be.calledWith(0);
      expect(global.logSpy).to.be.called;
    });
    it('defaults to relative devlab.yml file if manifest config not set', () => {
      expect(config.manifestPath).to.equal(`${config.cwd}/devlab.yml`);
    });
    it('overrides config/manifest if -c is passed with a new config', () => {
      config.checkArgs({ c: 'foo' });
      expect(config.manifestPath).to.equal(`${config.cwd}/foo`);
    });
    it('sets temp config.from if -f flag passed', () => {
      config.checkArgs({ f: 'custom' });
      expect(config.from).to.equal('custom');
    });
    it('sets task if passed from arguments', () => {
      config.checkArgs({ _: [ null, 'test' ] });
      expect(config.task).to.equal('test');
    });
  });
  describe('loadManifest', () => {
    it('exits with error when the manifest cannot be found', () => {
      config.manifestPath = 'does/not/live/here';
      config.loadManifest();
      expect(global.exitSpy).to.be.calledWith(1);
    });
    it('loads the manifest object when found', () => {
      // Use test project manifest
      config.manifestPath = `${config.cwd}/test/project/devlab.yml`;
      config.loadManifest();
      expect(config.manifest).to.be.an.object;
    });
  });
  describe('get', () => {
    it('exits if no task is specified', () => {
      config.args.c = '/test/project/devlab.yml';
      config.get();
      expect(global.exitSpy).to.be.calledWith(1);
    });
    it('returns the manifest object', () => {
      expect(config.get()).to.be.an.object;
    });
  });
});
