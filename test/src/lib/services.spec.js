'use strict'
const services = require('src/lib/services')
const exec = require('child_process').exec

describe('services', () => {
  describe('getArgs', () => {
    it('returns array of arguments required to run service', () => {
      expect(services.getArgs({ name: 'testSvc', image: 'testImage' })).to.deep.equal([
        '--name',
        'testSvc',
        'testImage'
      ])
    })
  })
  describe('startSvc', () => {
    after(done => {
      try {
        exec('docker stop mongotest && docker rm mongotest', () => done())
      } catch (e) {
        done()
      }
    })
    it('starts a service based on the object passed', done => {
      services.startSvc({ name: 'mongotest', image: 'mongo' })
        .then(done)
        .catch(done)
    })
    it('resolves if service is already started', done => {
      services.startSvc({ name: 'mongotest', image: 'mongo' })
        .then(done)
        .catch(done)
    })
    it('fails if invalid service is passed', done => {
      services.startSvc({ name: 'noimage', image: 'noimage12345' })
        .then(() => {
          done('Should have failed')
        })
        .catch(() => {
          done()
        })
    })
  })
})
