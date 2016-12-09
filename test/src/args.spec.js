'use strict'
const pkg = require('package.json')
const args = require('src/args')
const output = require('src/output')

const fixtures = {
  args: { e: true, _: [ '/bin/bash' ] }
}

describe('args', () => {
  let processExitStub
  let outputLogStub
  let outputErrorStub
  beforeEach(() => {
    processExitStub = sinon.stub(process, 'exit')
    outputLogStub = sinon.stub(output, 'log')
    outputErrorStub = sinon.stub(output, 'error')
    // args.raw = fixtures.args
  })
  afterEach(() => {
    process.exit.restore()
    output.log.restore()
    output.error.restore()
  })
  describe('showHelp', () => {
    it('shows the help message and exits', () => {
      args.showHelp()
      expect(outputLogStub).to.be.calledOnce()
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
  describe('isArg', () => {
    it('returns true if argument is valid', () => {
      expect(args.isArg('f')).to.be.true
    })
    it('displays an error and exits if argument is not valid', () => {
      expect(args.isArg('nope')).to.be.false
      expect(outputErrorStub).to.be.calledWith('Invalid argument \'nope\', please see documentation')
      expect(processExitStub).to.be.called()
    })
  })
  describe('getTask', () => {
    it('returns string with task', () => {
      args.raw = { _: [ 'foo', 'bar' ] }
      expect(args.getTask()).to.equal('foo bar')
    })
    it('returns empty string if no task specified', () => {
      args.raw = {}
      expect(args.getTask()).to.equal('')
    })
  })
  describe('parse', () => {
    it('parses args object and returns formatted config object', () => {
      args.raw = fixtures.args
      const actual = args.parse()
      expect(actual).to.deep.equal({
        exec: true,
        task: '/bin/sh'
      })
    })
    it('parses args and calls an action when passed', () => {
      args.raw = { v: true }
      const showVersionStub = sinon.stub(args, 'showVersion')
      args.parse()
      expect(showVersionStub).to.be.calledOnce()
      showVersionStub.restore()
    })
  })
})
