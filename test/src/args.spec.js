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
})
