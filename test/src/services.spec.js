const path = require('path')
const services = require('src/services')
const proc = require('src/proc')
const config = require('src/config')
const fixture = require('test/fixtures/service')

describe('services', () => {
  afterEach(() => {
    services.running = []
  })
  describe('get', () => {
    before(() => {
      config.defaultPath = path.resolve(__dirname, '../fixtures/devlab.yml')
    })
    it('returns false if no services are specified', () => {
      expect(services.get({})).to.be.false()
    })
    it('returns an array of services and their command arrays', () => {
      const svc = services.get(config.load())
      expect(svc[0].name).to.equal('mongodb')
      expect(svc[0].args).to.deep.equal([ 'run', '-d', '--privileged', '-p', '27017:27017', '--name', 'dl_mongodb_test', 'mongo:3.0' ])
    })
  })
  describe('run', () => {
    let procRunStub
    afterEach(() => {
      if (proc.exec.restore) proc.exec.restore()
      procRunStub.restore()
    })
    it('starts all non-running services', () => {
      global.instanceId = 'test'
      sinon.stub(proc, 'exec', (cmd) => { /* eslint no-undef: 0 */
        if (cmd === 'docker ps -f name=dl_redis_test -q') return Promise.resolve('123456')
        return Promise.resolve(undefined)
      })
      procRunStub = sinon.stub(proc, 'run', () => Promise.resolve())
      return services.run(fixture).then(() => {
        expect(services.running).to.deep.equal([ 'dl_mongodb_test' ])
      })
    })
    it('rejects when a service fails to start', () => {
      procRunStub = sinon.stub(proc, 'run', () => Promise.reject())
      return services.run([ { name: 'fart', args: [ 'foo' ] } ])
        .then(() => {
          throw new Error('Should have failed')
        })
        .catch(() => {
          expect(services.running.length).to.equal(0)
        })
    })
  })
  describe('stop', () => {
    let procRunDetachedStub
    beforeEach(() => {
      procRunDetachedStub = sinon.stub(proc, 'runDetached')
    })
    afterEach(() => {
      procRunDetachedStub.restore()
    })
    it('does nothing if no services are running', () => {
      services.running = []
      services.stop()
      expect(procRunDetachedStub).to.not.be.called()
    })
    it('calls proc.runDetached with stop and rm commands for running services', () => {
      services.running = [ 'dl_foo_test', 'dl_bar_test' ]
      services.stop()
      expect(procRunDetachedStub).to.be.calledWith('docker stop dl_foo_test && docker rm dl_foo_test && docker stop dl_bar_test && docker rm dl_bar_test')
    })
    it('calls proc.runDetached with stop and rm only for non-persistent services', () => {
      services.running = [ 'dl_foo_test', 'bar' ]
      services.stop()
      expect(procRunDetachedStub).to.be.calledWith('docker stop dl_foo_test && docker rm dl_foo_test')
    })
  })
  describe('checkDisabled', () => {
    afterEach(() => {
      services.disabled = []
    })
    it('does nothing if no task is supplied', () => {
      const cfg = { run: [] }
      expect(services.checkDisabled(cfg)).to.deep.equal(cfg)
    })
    it('does nothing if multiple tasks are supplied', () => {
      const cfg = { run: [ 'one', 'two' ] }
      expect(services.checkDisabled(cfg)).to.deep.equal(cfg)
    })
    it('does nothing if task config is not an object', () => {
      const cfg = { run: [ 'test' ], tasks: { test: 'echo "not an obj"' } }
      expect(services.checkDisabled(cfg)).to.deep.equal(cfg)
    })
    it('returns config with filtered services array', () => {
      const cfg = {
        services: [{ keep: { from: 'test' } }, { disable: { from: 'disable' } }],
        tasks: { test: { disable: [ 'disable' ], cmd: 'echo hello' } },
        run: [ 'test' ]
      }
      expect(services.checkDisabled(cfg).services).to.deep.equal([{ keep: { from: 'test' } }])
      expect(services.disabled[0]).to.equal('disable')
    })
  })
})
