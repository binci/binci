'use strict'
const pkg = require('package.json')
const args = require('src/args')
const output = require('src/output')

describe('args', () => {
  let processExitStub
  let outputLogStub
  beforeEach(() => {
    processExitStub = sinon.stub(process, 'exit')
    outputLogStub = sinon.stub(output, 'log')
  })
  afterEach(() => {
    process.exit.restore()
    output.log.restore()
  })
  describe('showHelp', () => {
    it('shows the help message and exits', () => {
      args.showHelp()
      expect(outputLogStub).to.be.called
      expect(processExitStub).to.be.calledWith(0)
    })
  })
  describe('showVersion', () => {
    it('shows the installed version and exits', () => {
      args.showVersion()
      expect(outputLogStub).to.be.calledWith(pkg.version)
      expect(processExitStub).to.be.calledWith(0)
    })
  })
  describe('setExecCommand', () => {
    it('returns object with exec property set', () => {
      expect(args.setExecCommand('foo')).to.deep.equal({ exec: 'foo' })
    })
  })
  describe('setPrimaryFrom', () => {
    it('returns object with from property set', () => {
      expect(args.setPrimaryFrom('foo')).to.deep.equal({ from: 'foo' })
    })
  })
  describe('setCustomConf', () => {
    it('returns object with configPath property set', () => {
      expect(args.setCustomConf('foo')).to.deep.equal({ configPath: 'foo' })
    })
  })
  describe('setQuietMode', () => {
    it('returns object with quietMode property set', () => {
      expect(args.setQuietMode(true)).to.deep.equal({ quietMode: true })
    })
  })
  describe('parse', () => {
    it('parses args object and returns formatted config object', () => {
      const actual = args.parse({ e: '/bin/bash', f: 'node:6', c: '/etc/devlab', q: true, _: [ 'some-task' ] })
      expect(actual).to.deep.equal({
        exec: '/bin/bash',
        from: 'node:6',
        configPath: '/etc/devlab',
        quietMode: true,
        task: 'some-task'
      })
    })
  })
})
