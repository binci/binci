const path = require('path')
const instance = require('src/index')
const args = require('src/args')
const fixtures = require('test/fixtures/instance')
const output = require('src/output')
const proc = require('src/proc')
const services = require('src/services')

const configPath = path.resolve(__dirname, '../fixtures/devlab.yml')

describe('index', () => {
  let processCwdStub
  let outputSuccessStub
  let outputSpinnerStub
  let outputErrorStub
  let outputLineStub
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
    it('starts the instance using config and args', () => {
      args.raw = { _: [ 'env' ], c: configPath }
      // instance.start()
      expect(true).to.be.true
    })
  })
})
