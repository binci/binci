const path = require('path')
const services = require('src/services')
const proc = require('src/proc')
const config = require('src/config')
const fixture = require('test/fixtures/service')

describe('services', () => {
  afterEach(() => {
    services.running = []
  })
  describe('getStopTimeSecs', () => {
    it('uses the service config stopTimeSecs property if exists', () => {
      const cfg = { stopTimeSecs: 3 }
      const svc = { stopTimeSecs: 5 }
      expect(services.getStopTimeSecs(cfg, svc)).to.equal(5)
    })
    it('uses the global config stopTimeSecs property if exists and no service config is set', () => {
      const cfg = { stopTimeSecs: 3 }
      const svc = {}
      expect(services.getStopTimeSecs(cfg, svc)).to.equal(3)
    })
    it('uses the system default if neither global or service config props are set', () => {
      expect(services.getStopTimeSecs({}, {})).to.equal(10)
    })
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
      expect(svc[0].args).to.deep.equal(['run', '-d', '--rm', '--privileged', '-p', '27017:27017', '--name', 'dl_mongodb_test', 'mongo:3.0'])
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
        expect(services.running).to.deep.equal([{ name: 'dl_mongodb_test', stopTimeSecs: 10 }])
      })
    })
    it('rejects when a service fails to start', () => {
      procRunStub = sinon.stub(proc, 'run', () => Promise.reject())
      return services.run([{ name: 'fart', args: ['foo'] }])
        .then(() => {
          throw new Error('Should have failed')
        })
        .catch(() => {
          expect(services.running.length).to.equal(0)
        })
    })
  })
  describe('stop', () => {
    let procRunStub
    beforeEach(() => {
      procRunStub = sinon.stub(proc, 'run', (svc) => Promise.resolve().then(() => {
        if (svc === 'dl_fail_test') {
          const testError = new Error()
          testError.svcs = ['dl_fail_test']
          throw testError
        }
        return
      }))
    })
    afterEach(() => {
      procRunStub.restore()
    })
    it('does nothing if no services are running', () => {
      services.running = []
      return services.stop()
        .then(() => {
          expect(procRunStub).to.not.be.called()
        })
    })
    it('resolves after calling proc.run with stop command for running services', () => {
      services.running = [{ name: 'dl_foo_test', stopTimeSecs: 10 }, { name: 'dl_bar_test', stopTimeSecs: 10 }]
      return services.stop()
        .then(() => {
          expect(procRunStub.getCalls()[0].args[0]).to.deep.equal(['stop', '-t', 10, 'dl_foo_test', ''])
          expect(procRunStub.getCalls()[1].args[0]).to.deep.equal(['stop', '-t', 10, 'dl_bar_test', ''])
        })
    })
    it('resolves after calling proc with stop and rm only for non-persistent services', () => {
      services.running = [{ name: 'dl_foo_test', stopTimeSecs: 10 }, { name: 'bar' }]
      return services.stop()
        .then(() => {
          expect(procRunStub.getCalls()[0].args[0]).to.deep.equal(['stop', '-t', 10, 'dl_foo_test', ''])
        })
    })
    it('rejects with error containing names of services that failed', () => {
      services.running = ['dl_foo_test', 'dl_fail_test']
      return services.stop()
        .catch((err) => {
          expect(procRunStub.getCalls()[0].args[0]).to.deep.equal(['stop', 'dl_foo_test'])
          expect(err.svcs).to.deep.equal(['dl_fail_test'])
        })
    })
  })
  describe('filterEnabled', () => {
    afterEach(() => {
      services.disabled = []
    })
    it('does nothing if no task is supplied', () => {
      const cfg = { run: [] }
      expect(services.filterEnabled(cfg)).to.deep.equal(cfg)
    })
    it('does nothing if single task config is not an object', () => {
      const cfg = { run: ['test'], tasks: { test: 'echo "not an obj"' } }
      expect(services.filterEnabled(cfg)).to.deep.equal(cfg)
    })
    it('does nothing if any task config is not an object', () => {
      const cfg = { run: ['string', 'obj'], tasks: { string: 'echo "not an obj"', obj: { disable: '*' } } }
      expect(services.filterEnabled(cfg)).to.deep.equal(cfg)
    })
    it('disables all services when \'*\' is supplied', () => {
      const cfg = {
        services: [{ disabledOne: { from: 'test' } }, { disabledTwo: { from: 'disable' } }],
        tasks: { test: { disable: '*', cmd: 'echo hello' } },
        run: ['test']
      }
      expect(services.filterEnabled(cfg).services).to.deep.equal([])
      expect(services.disabled).to.deep.equal(['disabledOne', 'disabledTwo'])
    })
    it('returns config with filtered services array', () => {
      const cfg = {
        services: [{ keep: { from: 'test' } }, { disable: { from: 'disable' } }],
        tasks: { test: { disable: ['disable'], cmd: 'echo hello' } },
        run: ['test']
      }
      expect(services.filterEnabled(cfg).services).to.deep.equal([{ keep: { from: 'test' } }])
      expect(services.disabled[0]).to.equal('disable')
    })
    it('disables services shared between chained tasks', () => {
      const cfg = {
        services: [{ shared: { from: 'test' } }, { onlyTest: { from: 'onlyTest' } }],
        tasks: { test: { disable: '*', cmd: 'echo hello' }, lint: { disable: ['shared'], cmd: 'lint' } },
        run: ['test', 'lint']
      }
      expect(services.filterEnabled(cfg).services).to.deep.equal([{ onlyTest: { from: 'onlyTest' } }])
      expect(services.disabled[0]).to.equal('shared')
    })
  })
})
