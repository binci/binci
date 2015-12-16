import testManifests from './../../fixtures/manifests'
import config from './../../../src/lib/config'

const originalProcessExit = process.exit
const exitSpy = sinon.stub()

describe('config', () => {
  before(() => {
    exitSpy.reset()
    // Override process.exit with return of code
    process.exit = exitSpy
  })
  after(() => {
    process.exit = originalProcessExit
  })
  describe('cwd', () => {
    it('contains an absolute path representing the current directory', () => {
      expect(config.cwd.startsWith('/')).to.be.true
    })
  })
  describe('args', () => {
    it('should return process arguments as an object', () => {
      expect(config.args).to.be.an.object
    })
  })
  describe('checkArgs', () => {
    it('outputs help message if -h flag is passed', () => {
      config.checkArgs({ h: true })
      expect(exitSpy).to.be.calledWith(0)
      // expect(logSpy).to.be.called;
    })
    it('outputs version if -v flag is passed', () => {
      config.checkArgs({ v: true })
      expect(exitSpy).to.be.calledWith(0)
      // expect(global.logSpy).to.be.called;
    })
    it('defaults to relative devlab.yml file if manifest config not set', () => {
      expect(config.manifestPath).to.equal(`${config.cwd}/devlab.yml`)
    })
    it('overrides config/manifest if -c is passed with a new config', () => {
      config.checkArgs({ c: 'foo' })
      expect(config.manifestPath).to.equal(`${config.cwd}/foo`)
    })
    it('sets temp config.from if -f flag passed', () => {
      config.checkArgs({ f: 'custom' })
      expect(config.from).to.equal('custom')
    })
    it('sets task if passed from arguments', () => {
      config.checkArgs({ _: [ null, 'test' ] })
      expect(config.task).to.equal('test')
    })
  })
  describe('loadManifest', () => {
    it('exits with error when the manifest cannot be found', () => {
      config.manifestPath = 'does/not/live/here'
      config.loadManifest()
      expect(exitSpy).to.be.calledWith(1)
    })
    it('loads the manifest object when found', () => {
      // Use test project manifest
      config.manifestPath = `${config.cwd}/test/project/devlab.yml`
      config.loadManifest()
      expect(config.manifest).to.be.an.object
    })
  })
  describe('setupRun', () => {
    it('parses a simple, single task', () => {
      expect(config.setupRun(testManifests.simple, 'foo'))
        .to.equal('set -e; bar;')
    })
    it('parses a simple task with a before-task set', () => {
      expect(config.setupRun(testManifests.simpleBefore, 'foo'))
        .to.equal('set -e; baz; bar;')
    })
    it('parses a simple task with a before-task and after-task set', () => {
      expect(config.setupRun(testManifests.simpleBeforeAfter, 'foo'))
        .to.equal('set -e; baz; bar; quz')
    })
    it('parses a task with a multi-line before-task set', () => {
      expect(config.setupRun(testManifests.multiLnBefore, 'foo'))
        .to.equal('set -e; fizz; buzz; bar;')
    })
    it('parses a task with a multi-line before-task and after-task set', () => {
      expect(config.setupRun(testManifests.multiLnBeforeAfter, 'foo'))
        .to.equal('set -e; fizz; buzz; bar; lor; ips')
    })
    it('parses a simple task with a command alias', () => {
      expect(config.setupRun(testManifests.simpleAlias, 'baz'))
        .to.equal('set -e; bar;')
    })
    it('parses a complex task with multiple command aliases', () => {
      expect(config.setupRun(testManifests.multiAlias, 'fiz'))
        .to.equal('set -e; bar; quz; ips;')
    })
    it('parses a complex task with multiple command aliases and before-task and after-task', () => {
      expect(config.setupRun(testManifests.complexMultiAlias, 'fiz'))
        .to.equal('set -e; fizz; buzz; bar; quz; ips; lor; ips')
    })
  })
  describe('get', () => {
    it('exits if no task is specified', () => {
      config.args.c = '/test/project/devlab.yml'
      config.get()
      expect(exitSpy).to.be.calledWith(1)
    })
    it('returns the manifest object', () => {
      expect(config.get()).to.be.an.object
    })
  })
})
