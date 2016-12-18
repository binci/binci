'use strict'
const pkg = require('package.json')
const args = require('src/args')

const fixtures = {
  args: { e: true, _: [ '/bin/bash' ] }
}

describe('args', () => {
  let processExitStub
  let logSpy
  beforeEach(() => {
    logSpy = sinon.spy(console, 'log')
    processExitStub = sinon.stub(process, 'exit')
  })
  afterEach(() => {
    process.exit.restore()
    logSpy.restore()
  })
  describe('showHelp', () => {
    it('shows the help message and exits', () => {
      args.showHelp()
      expect(logSpy).to.be.calledOnce()
      expect(processExitStub).to.be.calledWith(0)
    })
  })
  describe('showVersion', () => {
    it('shows the installed version and exits', () => {
      args.showVersion()
      expect(logSpy).to.be.calledWith(pkg.version)
      expect(processExitStub).to.be.calledWith(0)
    })
  })
  describe('isArg', () => {
    it('returns true if argument is valid', () => {
      expect(args.isArg('f')).to.be.true
    })
    it('displays an error and exits if argument is not valid', () => {
      expect(() => args.isArg('nope')).to.throw('Invalid argument \'nope\', please see documentation')
    })
  })
  describe('getTask', () => {
    it('returns string with task', () => {
      args.raw = { _: [ 'foo', 'bar' ] }
      expect(args.getTask()).to.deep.equal([ 'foo', 'bar' ])
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
        run: [ '/bin/bash' ]
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
