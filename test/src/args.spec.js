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
  describe('parse', () => {
    it('parses args object and returns formatted config object', () => {
      const actual = args.parse({ e: '/bin/bash', f: 'node:6', c: '/etc/devlab', q: true, _: [ 'foo', 'bar' ] })
      expect(actual).to.deep.equal({
        exec: '/bin/bash',
        from: 'node:6',
        configPath: '/etc/devlab',
        quietMode: true,
        task: 'foo bar'
      })
    })
    it('parses args and calls an action when passed', () => {
      const showVersionStub = sinon.stub(args, 'showVersion')
      args.parse({ v: true })
      expect(showVersionStub).to.be.calledOnce
      showVersionStub.restore()
    })
  })
})
