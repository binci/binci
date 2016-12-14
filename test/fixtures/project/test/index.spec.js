const expect = require('chai').expect
const MongoTest = require('./../src/index')

const mongoAddr = process.env.MONGODB_PORT_27017_TCP_ADDR
const mongoPort = process.env.MONGODB_PORT_27017_TCP_PORT

const mongo = new MongoTest(`mongodb://${mongoAddr}:${mongoPort}/test`)
mongo.collection = 'test'

describe('MongoTest', () => {
  describe('execute', () => {
    before(() => mongo.createCollection())
    it('executes a method with args supplied', () =>  mongo.execute('stats')
      .then((res) => {
        expect(res).to.be.an.object
      })
    )
  })
})
