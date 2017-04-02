'use strict'
const fs = require('fs')
const pkg = require('package.json')
const args = require('src/args')
const utils = require('src/utils')

const fixtures = {
  args: { e: true, _: ['/bin/bash'] }
}
const sandbox = sinon.sandbox.create()

describe('args', () => {
  beforeEach(() => {
    sandbox.spy(console, 'log')
    sandbox.stub(process, 'exit')
  })
  afterEach(() => {
    sandbox.restore()
  })
  describe('tasks', () => {
    const confPath = `${process.cwd()}/devlab.yml`

    before(() => {
      fs.writeFileAsync(confPath, [
        'tasks:',
        '  stuff: echo "stuff" > /dev/null',
        '  lint: eslint .',
        '  ci: stuff test'
      ].join('\n'))
    })

    after(() => {
      fs.unlinkAsync(confPath)
    })

    it('pretty prints all tasks in the config', () => {
      args.tasks()
      expect(console.log).to.have.been.calledWithExactly([
        '',
        'Tasks:',
        '  stuff    echo "stuff" > /dev/null',
        '  lint     eslint .',
        '  ci       stuff test'
      ].join('\n'))
      expect(process.exit).to.be.calledWith(0)
    })
  })
  describe('showHelp', () => {
    it('shows the help message and exits', () => {
      args.showHelp()
      expect(console.log).to.be.calledOnce()
      expect(process.exit).to.be.calledWith(0)
    })
  })
  describe('showVersion', () => {
    it('shows the installed version and exits', () => {
      args.showVersion()
      expect(console.log).to.be.calledWith(pkg.version)
      expect(process.exit).to.be.calledWith(0)
    })
  })
  describe('cleanupDL', () => {
    beforeEach(() => {
      sandbox.stub(utils, 'cleanup', () => Promise.resolve())
    })
    it('call utils.cleanup with no arguments', () => {
      return args.cleanupDL().then(() => {
        expect(utils.cleanup).to.be.calledOnce()
      })
    })
    it('exits code 0 on success', () => {
      return args.cleanupDL()
        .then(() => {
          expect(process.exit).to.have.been.calledOnce()
          expect(process.exit).to.have.been.calledWithExactly(0)
        })
    })
    it('exits code 1 on fail', () => {
      utils.cleanup.restore()
      sandbox.stub(utils, 'cleanup', () => Promise.reject())
      return args.cleanupDL()
        .then(() => {
          expect(process.exit).to.have.been.calledOnce()
          expect(process.exit).to.have.been.calledWithExactly(1)
        })
    })
  })
  describe('cleanupAll', () => {
    beforeEach(() => {
      sandbox.stub(utils, 'cleanup', () => Promise.resolve())
    })
    it('call utils.cleanup with no arguments', () => {
      args.cleanupAll()
      expect(utils.cleanup).to.be.calledWith(true)
    })
    it('exits code 0 on success', () => {
      return args.cleanupAll()
        .then(() => {
          expect(process.exit).to.have.been.calledOnce()
          expect(process.exit).to.have.been.calledWithExactly(0)
        })
    })
    it('exits code 1 on fail', () => {
      utils.cleanup.restore()
      sandbox.stub(utils, 'cleanup', () => Promise.reject())
      return args.cleanupAll()
        .then(() => {
          expect(process.exit).to.have.been.calledOnce()
          expect(process.exit).to.have.been.calledWithExactly(1)
        })
    })
  })
  describe('isArg', () => {
    it('returns true if argument is valid', () => {
      expect(args.isArg('f')).to.be.true()
    })
    it('displays an error and exits if argument is not valid', () => {
      expect(() => args.isArg('nope')).to.throw('Invalid argument \'nope\', please see documentation')
    })
  })
  describe('getTask', () => {
    it('returns string with task', () => {
      args.raw = { _: ['foo', 'bar'] }
      expect(args.getTask()).to.deep.equal(['foo', 'bar'])
    })
    it('returns empty string if no task specified', () => {
      args.raw = {}
      expect(args.getTask()).to.equal('')
    })
  })
  describe('parse', () => {
    it('parses args object and returns formatted config object', () => {
      args.raw = fixtures.args
      return args.parse().then(actual => {
        expect(actual).to.deep.equal({
          exec: true,
          run: ['/bin/bash']
        })
      })
    })
    it('parses args and calls an action when passed', () => {
      args.raw = { v: true }
      sandbox.stub(args, 'showVersion')
      return args.parse().then(() => {
        expect(args.showVersion).to.be.calledOnce()
      })
    })
  })
})
