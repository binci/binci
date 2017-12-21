const path = require('path')
const fs = require('fs')
const Promise = require('bluebird')
const yaml = require('js-yaml')

const sandbox = require('test/sandbox')
const mockUpdateNotifierInstance = { update: { latest: '1.1.1' } }
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
const images = require('src/images')
const fixtures = require('test/fixtures/instance')
Promise.promisifyAll(fs)

const configPath = path.resolve(__dirname, '../fixtures/binci.yml')
const getConfig = () => yaml.safeLoad(fs.readFileSync(configPath, 'utf8'))

describe('index', () => {
  global.instanceId = 'test'
  beforeEach(() => {
    sandbox.stub(process, 'cwd', () => '/tmp')
    sandbox.stub(output, 'spinner', () => {
      return { succeed: () => null, fail: () => null }
    })
    sandbox.stub(output, 'line')
    sandbox.stub(output, 'success')
    sandbox.stub(output, 'warn')
    sandbox.stub(output, 'error')
  })
  describe('checkForUpdates', () => {
    it('warns user if an update is available', () => {
      expect(mockUpdateNotifier).not.to.have.been.called()
      instance.checkForUpdates()
      expect(mockUpdateNotifier).to.have.been.calledOnce()
      expect(mockUpdateNotifier).to.have.been.calledWithExactly({ pkg })
      expect(output.warn).to.be.calledWith(`Update available: ${mockUpdateNotifierInstance.update.latest}`)
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
  describe('getProjectConfig', () => {
    it('loads config and args and merges them', () => {
      args.raw = { f: 'node:6', e: 'echo "foo"', _: [], c: configPath }
      return instance.getProjectConfig().then(cfg => {
        expect(cfg).to.have.property('from').equal('node:6')
        expect(cfg).to.have.property('exec').equal('echo "foo"')
        expect(cfg).to.have.property('expose').deep.equal([ '8080:8080' ])
      })
    })
    it('removes the "from" param when -b is passed to the cli', () => {
      args.raw = { b: './Dockerfile', _: [], c: configPath }
      return instance.getProjectConfig().then(cfg => {
        expect(cfg).to.not.have.property('from')
        expect(cfg).to.have.property('dockerfile').equal('./Dockerfile')
      })
    })
    it('rejects when both -f and -b are passed to the cli', () => {
      args.raw = { f: 'node:6', b: './Dockerfile', _: [], c: configPath }
      return expect(instance.getProjectConfig()).to.be.rejectedWith(/both/)
    })
  })
  describe('getRunConfig', () => {
    it('loads config and args and returns exec run command objects', () => {
      const rmOnShutdown = false
      args.raw = { f: 'node:6', e: 'echo "foo"', _: [], c: configPath }
      return instance.getProjectConfig()
        .then(cfg => instance.getRunConfig(cfg, rmOnShutdown))
        .then(cfg => {
          expect(cfg).to.deep.equal(fixtures.exec)
        })
    })
    it('loads config and args and returns task run command objects', () => {
      const rmOnShutdown = false
      args.raw = { f: 'node:6', _: ['env'], c: configPath }
      return instance.getProjectConfig()
        .then(cfg => instance.getRunConfig(cfg, rmOnShutdown))
        .then(cfg => {
          expect(cfg).to.deep.equal(fixtures.task)
        })
    })
  })
  describe('attachFrom', () => {
    it('changes nothing if a "from" field exists', () => {
      const conf1 = getConfig()
      const conf2 = getConfig()
      return instance.attachFrom(conf2).then(cfg => {
        expect(cfg).to.deep.equal(conf1)
      })
    })
    it('sets the "from" to the built image if not specified', () => {
      const conf = getConfig()
      delete conf.from
      sandbox.stub(images, 'getImage', () => Promise.resolve('deadbeef'))
      return instance.attachFrom(conf).then(cfg => {
        expect(cfg).to.have.property('from').equal('deadbeef')
      })
    })
    it('passes extra tags to the image build process', () => {
      const conf = getConfig()
      delete conf.from
      conf.tags = ['foo', 'bar']
      const stub = sandbox.stub(images, 'getImage', () => Promise.resolve('foo'))
      return instance.attachFrom(conf).then(() => {
        expect(stub).to.be.calledWith(undefined, ['foo', 'bar'])
      })
    })
  })
  describe('start', () => {
    it('calls checkForUpdates', () => {
      sandbox.stub(instance, 'checkForUpdates')
      sandbox.stub(instance, 'getProjectConfig', () => Promise.resolve({}))
      sandbox.stub(instance, 'getRunConfig', () => Promise.resolve({ primary: {} }))
      sandbox.stub(instance, 'attachFrom', cfg => cfg)
      sandbox.stub(fs, 'writeFileAsync', () => Promise.resolve())
      sandbox.stub(instance, 'runCommand', () => Promise.resolve())
      sandbox.stub(instance, 'startServices', () => Promise.resolve())
      return instance.start().then(() => {
        expect(instance.checkForUpdates).to.have.been.calledOnce()
        expect(instance.checkForUpdates).to.have.been.calledWithExactly(undefined)
      })
    })
    it('outputs default failure message if rejected without error message', () => {
      sandbox.stub(instance, 'getProjectConfig', () => {
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
      sandbox.stub(instance, 'attachFrom', cfg => cfg)
      sandbox.stub(fs, 'writeFileAsync', () => Promise.resolve())
      sandbox.stub(instance, 'startServices', () => Promise.resolve())
      sandbox.stub(instance, 'runCommand', () => Promise.resolve())
      sandbox.stub(fs, 'unlinkAsync', () => Promise.resolve())
      args.raw = { _: ['env'], c: configPath }
      return expect(instance.start()).to.be.fulfilled()
    })
  })
})
