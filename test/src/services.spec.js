const path = require('path')
const services = require('src/services')
const config = require('src/config')

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
      expect(svc[0].args).to.deep.equal([ 'run', '--rm', '-d', '--privileged', '-p', '27017:27017', '--name', 'dl_mongodb', 'mongo:3.0' ])
    })
  })
})
