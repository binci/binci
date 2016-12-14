const path = require('path')
const services = require('src/services')
const proc = require('src/proc')
const config = require('src/config')
const fixture = require('test/fixtures/service')

describe('services', () => {
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
      expect(svc[0].args).to.deep.equal([ 'run', '-d', '--privileged', '-p', '27017:27017', '--name', 'dl_mongodb', 'mongo:3.0' ])
    })
  })
  describe('run', () => {
    let procRunStub
    afterEach(() => {
      procRunStub.restore()
      services.running = []
    })
    it('resloves promise(s) for all service starts', () => {
      procRunStub = sinon.stub(proc, 'run', () => Promise.resolve())
      return services.run(fixture).then(() => {
        expect(services.running).to.deep.equal([ 'dl_mongodb' ])
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
      services.running = []
    })
    it('does nothing if no services are running', () => {
      services.running = []
      services.stop()
      expect(procRunDetachedStub).to.not.be.called()
    })
    it('calls proc.runDetached with stop and rm commands for running services', () => {
      services.running = [ 'foo', 'bar' ]
      services.stop()
      expect(procRunDetachedStub).to.be.calledWith([ 'docker', 'stop', 'foo', '&&', 'docker', 'rm', 'foo', '&&', 'docker', 'stop', 'bar', '&&', 'docker', 'rm', 'bar' ])
    })
  })
})
