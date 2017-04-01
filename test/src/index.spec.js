const path = require('path')
const fs = require('fs')
const Promise = require('bluebird')
const instance = require('src/index')
const args = require('src/args')
const fixtures = require('test/fixtures/instance')
const output = require('src/output')
const proc = require('src/proc')
const services = require('src/services')

Promise.promisifyAll(fs)

const configPath = path.resolve(__dirname, '../fixtures/devlab.yml')

describe('index', () => {
  global.instanceId = 'test'
  let processCwdStub
  let outputSuccessStub
  let outputSpinnerStub
  let outputErrorStub
  let outputLineStub
  let servicesStopStub
  before(() => {
    processCwdStub = sinon.stub(process, 'cwd', () => '/tmp')
    outputSpinnerStub = sinon.stub(output, 'spinner', () => {
      return { succeed: () => null, fail: () => null }
    })
    outputLineStub = sinon.stub(output, 'line')
    outputSuccessStub = sinon.stub(output, 'success')
    outputErrorStub = sinon.stub(output, 'error')
  })
  after(() => {
    processCwdStub.restore()
    outputSpinnerStub.restore()
    outputSuccessStub.restore()
    outputErrorStub.restore()
    outputLineStub.restore()
  })
  describe('startServices', () => {
    let servicesRunStub
    afterEach(() => {
      if (servicesRunStub) servicesRunStub.restore()
    })
    it('imediately resolves if there are no services', () => {
      const cfg = { services: [] }
      return expect(instance.startServices(cfg)).to.be.fulfilled()
    })
    it('resolves after services are successfully started', () => {
      const cfg = { services: [ 'foo', 'bar' ] }
      servicesRunStub = sinon.stub(services, 'run', () => Promise.resolve())
      return expect(instance.startServices(cfg)).to.be.fulfilled()
    })
    it('rejects after services fail to start', () => {
      const cfg = { services: [ 'foo' ] }
      servicesRunStub = sinon.stub(services, 'run', () => Promise.reject())
      return expect(instance.startServices(cfg)).to.be.rejected()
    })
  })
  describe('stopServices', () => {
    beforeEach(() => {
      services.running = [ 'foo', 'bar' ]
    })
    afterEach(() => {
      if (servicesStopStub) servicesStopStub.restore()
      services.running = []
    })
    it('resolves early if no services are running', () => {
      services.running = []
      return expect(instance.stopServices()).to.be.fulfilled()
    })
    it('resolves after stopping all services', () => {
      servicesStopStub = sinon.stub(services, 'stop', () => Promise.resolve())
      return expect(instance.stopServices()).to.be.fulfilled()
    })
    it('rejects with failed services and outputs error', () => {
      servicesStopStub = sinon.stub(services, 'stop', () => Promise.reject(new Error()))
      return expect(instance.stopServices()).to.be.rejected()
    })
  })
  describe('runCommand', () => {
    let procRunStub
    afterEach(() => {
      procRunStub.restore()
    })
    it('starts command, succeeds, and resolves with stopServices', () => {
      procRunStub = sinon.stub(proc, 'run', () => Promise.resolve())
      return instance.runCommand({ primary: [ 'foo' ] })
        .then(() => {
          expect(outputLineStub).to.be.called()
          expect(outputSuccessStub).to.be.called()
        })
    })
    it('starts command, fails, and throws', () => {
      procRunStub = sinon.stub(proc, 'run', () => Promise.reject(1))
      return expect(instance.runCommand({ primary: [ 'foo' ] })).to.be.rejectedWith('Command failed')
    })
  })
  describe('getConfig', () => {
    it('loads config and args and returns exec run command objects', () => {
      args.raw = { f: 'node:6', e: 'echo "foo"', _: [], c: configPath }
      expect(instance.getConfig()).to.deep.equal(fixtures.exec)
    })
    it('loads config and args and returns task run command objects', () => {
      args.raw = { f: 'node:6', _: [ 'env' ], c: configPath }
      expect(instance.getConfig()).to.deep.equal(fixtures.task)
    })
  })
  describe('start', () => {
    afterEach(() => {
      if (fs.writeFileAsync.restore) fs.writeFileAsync.restore()
      if (instance.startServices.restore) instance.startServices.restore()
      if (instance.runCommand.restore) instance.runCommand.restore()
      if (instance.getConfig.restore) instance.getConfig.restore()
      if (fs.unlinkAsync.restore) fs.unlinkAsync.restore()
    })
    it('outputs default failure message if rejected without error message', () => {
      sinon.stub(instance, 'getConfig', () => {
        const err = new Error()
        err.message = undefined
        throw err
      })
      return expect(instance.start()).to.be.rejectedWith('Process failed')
    })
    it('throws and outputs error when config throws', () => {
      args.raw = { 'not-a-flag': true, _: [ 'env' ], c: configPath }
      return instance.start().then(() => new Error('Should have failed'))
        .catch(() => {
          expect(outputErrorStub).to.be.calledWith('Invalid argument \'not-a-flag\', please see documentation')
        })
    })
    it('throws when unable to start services', () => {
      sinon.stub(instance, 'startServices', () => Promise.reject())
      args.raw = { _: [ 'env' ], c: configPath }
      return expect(instance.start()).to.be.rejected()
    })
    it('throws when unable to write exec file to tmp', () => {
      sinon.stub(fs, 'writeFileAsync', () => Promise.reject())
      sinon.stub(instance, 'startServices', () => Promise.resolve())
      sinon.stub(instance, 'runCommand', () => Promise.resolve())
      sinon.stub(fs, 'unlinkAsync', () => Promise.resolve())
      args.raw = { 'f': 'notactuallyanimage', _: [ 'env' ], c: configPath }
      return expect(instance.start()).to.be.rejected()
    })
    it('throws when unable to start primary container', () => {
      sinon.stub(fs, 'writeFileAsync', () => Promise.resolve())
      sinon.stub(instance, 'startServices', () => Promise.resolve())
      sinon.stub(instance, 'runCommand', () => Promise.reject())
      sinon.stub(fs, 'unlinkAsync', () => Promise.resolve())
      args.raw = { 'f': 'notactuallyanimage', _: [ 'env' ], c: configPath }
      return expect(instance.start()).to.be.rejected()
    })
    it('resolves when config, services and primary container run successfully', () => {
      sinon.stub(fs, 'writeFileAsync', () => Promise.resolve())
      sinon.stub(instance, 'startServices', () => Promise.resolve())
      sinon.stub(instance, 'runCommand', () => Promise.resolve())
      sinon.stub(fs, 'unlinkAsync', () => Promise.resolve())
      args.raw = { _: [ 'env' ], c: configPath }
      return expect(instance.start()).to.be.fulfilled()
    })
  })
})
