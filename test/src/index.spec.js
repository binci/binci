const path = require('path')
const fs = require('fs')
const Promise = require('bluebird')

const sandbox = require('test/sandbox')
const mockUpdateNotifierInstance = { notify: sandbox.spy() }
const mockUpdateNotifier = sandbox.spy(() => mockUpdateNotifierInstance)
proxyquire('src/index', {
  'update-notifier': mockUpdateNotifier
})
const pkg = require('package.json')
const instance = require('src/index')
const args = require('src/args')
const output = require('src/output')
const proc = require('src/proc')
const services = require('src/services')
const fixtures = require('test/fixtures/instance')
Promise.promisifyAll(fs)

const configPath = path.resolve(__dirname, '../fixtures/devlab.yml')

describe('index', () => {
  global.instanceId = 'test'
  beforeEach(() => {
    sandbox.stub(process, 'cwd', () => '/tmp')
    sandbox.stub(output, 'spinner', () => {
      return { succeed: () => null, fail: () => null }
    })
    sandbox.stub(output, 'line')
    sandbox.stub(output, 'success')
    sandbox.stub(output, 'error')
  })
  describe('checkForUpdates', () => {
    it('calls updateNotifier().notify()', () => {
      expect(mockUpdateNotifier).not.to.have.been.called()
      expect(mockUpdateNotifierInstance.notify).not.to.have.been.called()

      instance.checkForUpdates()

      expect(mockUpdateNotifier).to.have.been.calledOnce()
      expect(mockUpdateNotifier).to.have.been.calledWithExactly({ pkg })
      expect(mockUpdateNotifierInstance.notify).to.have.been.calledOnce()
      expect(mockUpdateNotifierInstance.notify).to.have.been.calledWithExactly()
    })
  })
  describe('startServices', () => {
    it('immediately resolves if there are no services', () => {
      const cfg = { services: [] }
      return expect(instance.startServices(cfg)).to.be.fulfilled()
    })
    it('resolves after services are successfully started', () => {
      const cfg = { services: ['foo', 'bar'] }
      sandbox.stub(services, 'run', () => Promise.resolve())
      return expect(instance.startServices(cfg)).to.be.fulfilled()
    })
    it('rejects after services fail to start', () => {
      const cfg = { services: ['foo'] }
      sandbox.stub(services, 'run', () => Promise.reject())
      return expect(instance.startServices(cfg)).to.be.rejected()
    })
  })
  describe('stopServices', () => {
    beforeEach(() => {
      services.running = ['foo', 'bar']
    })
    afterEach(() => {
      services.running = []
    })
    it('resolves early if no services are running', () => {
      services.running = []
      return expect(instance.stopServices()).to.be.fulfilled()
    })
    it('resolves after stopping all services', () => {
      sandbox.stub(services, 'stop', () => Promise.resolve())
      return expect(instance.stopServices()).to.be.fulfilled()
    })
    it('rejects with failed services and outputs error', () => {
      sandbox.stub(services, 'stop', () => Promise.reject(new Error()))
      return expect(instance.stopServices()).to.be.rejected()
    })
  })
  describe('runCommand', () => {
    it('starts command, succeeds, and resolves with stopServices', () => {
      sandbox.stub(proc, 'run', () => Promise.resolve())
      return instance.runCommand({ primary: ['foo'] })
        .then(() => {
          expect(output.line).to.be.called()
          expect(output.success).to.be.called()
        })
    })
    it('starts command, fails, and throws', () => {
      sandbox.stub(proc, 'run', () => Promise.reject(1))
      return expect(instance.runCommand({ primary: ['foo'] })).to.be.rejectedWith('Command failed')
    })
  })
  describe('getConfig', () => {
    it('loads config and args and returns exec run command objects', () => {
      const rmOnShutdown = false
      args.raw = { f: 'node:6', e: 'echo "foo"', _: [], c: configPath }
      return instance.getConfig(rmOnShutdown).then(cfg => {
        expect(cfg).to.deep.equal(fixtures.exec)
      })
    })
    it('loads config and args and returns task run command objects', () => {
      const rmOnShutdown = false
      args.raw = { f: 'node:6', _: ['env'], c: configPath }
      return instance.getConfig(rmOnShutdown).then(cfg => {
        expect(cfg).to.deep.equal(fixtures.task)
      })
    })
  })
  describe('start', () => {
    it('calls checkForUpdates', () => {
      sandbox.stub(instance, 'checkForUpdates')
      sandbox.stub(instance, 'getConfig', () => Promise.resolve({ primary: {} }))
      sandbox.stub(fs, 'writeFileAsync', () => Promise.resolve())
      sandbox.stub(instance, 'runCommand', () => Promise.resolve())
      sandbox.stub(instance, 'startServices', () => Promise.resolve())
      return instance.start().then(() => {
        expect(instance.checkForUpdates).to.have.been.calledOnce()
        expect(instance.checkForUpdates).to.have.been.calledWithExactly(undefined)
      })
    })
    it('outputs default failure message if rejected without error message', () => {
      sandbox.stub(instance, 'getConfig', () => {
        const err = new Error()
        err.message = undefined
        throw err
      })
      return expect(instance.start()).to.be.rejectedWith('Process failed')
    })
    it('throws and outputs error when config throws', () => {
      args.raw = { 'not-a-flag': true, _: ['env'], c: configPath }
      return instance.start().then(() => new Error('Should have failed'))
        .catch(() => {
          expect(output.error).to.be.calledWith('Invalid argument \'not-a-flag\', please see documentation')
        })
    })
    it('throws when unable to start services', () => {
      sandbox.stub(instance, 'startServices', () => Promise.reject())
      args.raw = { _: ['env'], c: configPath }
      return expect(instance.start()).to.be.rejected()
    })
    it('throws when unable to write exec file to tmp', () => {
      sandbox.stub(fs, 'writeFileAsync', () => Promise.reject())
      sandbox.stub(instance, 'startServices', () => Promise.resolve())
      sandbox.stub(instance, 'runCommand', () => Promise.resolve())
      sandbox.stub(fs, 'unlinkAsync', () => Promise.resolve())
      args.raw = { 'f': 'notactuallyanimage', _: ['env'], c: configPath }
      return expect(instance.start()).to.be.rejected()
    })
    it('throws when unable to start primary container', () => {
      sandbox.stub(fs, 'writeFileAsync', () => Promise.resolve())
      sandbox.stub(instance, 'startServices', () => Promise.resolve())
      sandbox.stub(instance, 'runCommand', () => Promise.reject())
      sandbox.stub(fs, 'unlinkAsync', () => Promise.resolve())
      args.raw = { 'f': 'notactuallyanimage', _: ['env'], c: configPath }
      return expect(instance.start()).to.be.rejected()
    })
    it('resolves when config, services and primary container run successfully', () => {
      sandbox.stub(fs, 'writeFileAsync', () => Promise.resolve())
      sandbox.stub(instance, 'startServices', () => Promise.resolve())
      sandbox.stub(instance, 'runCommand', () => Promise.resolve())
      sandbox.stub(fs, 'unlinkAsync', () => Promise.resolve())
      args.raw = { _: ['env'], c: configPath }
      return expect(instance.start()).to.be.fulfilled()
    })
  })
})
