const path = require('path')
const _ = require('halcyon')
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
      config.defaultPath = path.resolve(__dirname, '../fixtures/binci.yml')
    })
    it('returns false if no services are specified', () => {
      expect(services.get({})).to.be.false()
    })
    it('returns an array of services and their command arrays', () => {
      const svc = services.get(_.merge({ rmOnShutdown: false }, config.load()))
      expect(svc[0].name).to.equal('mongodb')
      expect(svc[0].args).to.deep.equal(['run', '-d', '--rm', '--privileged', '-p', '27017:27017', '--name', 'bc_mongodb_test', 'mongo:3.0'])
    })
    it('returns an array of services and their command arrays (with rmOnShutdown)', () => {
      const svc = services.get(_.merge({ rmOnShutdown: true }, config.load()))
      expect(svc[0].name).to.equal('mongodb')
      expect(svc[0].args).to.deep.equal(['run', '-d', '--privileged', '-p', '27017:27017', '--name', 'bc_mongodb_test', 'mongo:3.0'])
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
        if (cmd === 'docker ps -f name=bc_redis_test -q') return Promise.resolve('123456')
        return Promise.resolve(undefined)
      })
      procRunStub = sinon.stub(proc, 'run', () => Promise.resolve())
      return services.run(fixture).then(() => {
        expect(services.running).to.deep.equal([{ name: 'bc_mongodb_test', stopTimeSecs: 10 }])
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
        if (svc === 'bc_fail_test') {
          const testError = new Error()
          testError.svcs = ['bc_fail_test']
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
      services.running = [{ name: 'bc_foo_test', stopTimeSecs: 10 }, { name: 'bc_bar_test', stopTimeSecs: 10 }]
      const cfg = { rmOnShutdown: false }
      return services.stop(cfg)
        .then(() => {
          expect(procRunStub.getCalls()[0].args[0]).to.deep.equal(['stop', '-t', 10, 'bc_foo_test'])
          expect(procRunStub.getCalls()[1].args[0]).to.deep.equal(['stop', '-t', 10, 'bc_bar_test'])
        })
    })
    it('resolves after calling proc.run with stop and rm commands', () => {
      const cfg = { rmOnShutdown: true }
      services.running = [{ name: 'bc_foo_test', stopTimeSecs: 10 }, { name: 'bc_bar_test', stopTimeSecs: 10 }]
      return services.stop(cfg)
        .then(() => {
          expect(procRunStub.getCalls()[0].args[0]).to.deep.equal(['stop', '-t', 10, 'bc_foo_test'])
          expect(procRunStub.getCalls()[1].args[0]).to.deep.equal(['stop', '-t', 10, 'bc_bar_test'])
          expect(procRunStub.getCalls()[2].args[0]).to.deep.equal(['rm', 'bc_foo_test'])
          expect(procRunStub.getCalls()[3].args[0]).to.deep.equal(['rm', 'bc_bar_test'])
        })
    })
    it('resolves after calling proc with stop and rm only for non-persistent services', () => {
      const cfg = { rmOnShutdown: false }
      services.running = [{ name: 'bc_foo_test', stopTimeSecs: 10 }, { name: 'bar' }]
      return services.stop(cfg)
        .then(() => {
          expect(procRunStub.getCalls()[0].args[0]).to.deep.equal(['stop', '-t', 10, 'bc_foo_test'])
        })
    })
    it('rejects with error containing names of services that failed', () => {
      services.running = ['bc_foo_test', 'bc_fail_test']
      return services.stop()
        .catch((err) => {
          expect(procRunStub.getCalls()[0].args[0]).to.deep.equal(['stop', 'bc_foo_test'])
          expect(err.svcs).to.deep.equal(['bc_fail_test'])
        })
    })
  })
  describe('filterEnabled', () => {
    afterEach(() => {
      services.disabled = []
      services.disableAll = false
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
    it('disables all services when disableAll is true', () => {
      const cfg = {
        services: [{ disabledOne: { from: 'test' } }, { disabledTwo: { from: 'disable' } }],
        tasks: { test: 'echo hello' },
        run: ['test']
      }
      services.disableAll = true
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
      // testing -d arg for config-disabled service
      services.disabled = [ 'shared' ]
      expect(services.filterEnabled(cfg).services).to.deep.equal([{ onlyTest: { from: 'onlyTest' } }])
      expect(services.disabled[0]).to.equal('shared')
    })
    it('disables services via command line and task config', () => {
      const cfg = {
        services: [{ keep: { from: 'test' } }, { configSvc: { from: 'configSvc' } }, { cliSvc: { from: 'cliSvc' } }],
        tasks: { test: { disable: ['configSvc'], cmd: 'echo hello' } },
        run: ['test']
      }
      services.disabled = [ 'cliSvc' ]
      expect(services.filterEnabled(cfg).services).to.deep.equal([{ keep: { from: 'test' } }])
      expect(services.disabled).to.deep.equal([ 'configSvc', 'cliSvc' ])
    })
  })
})
