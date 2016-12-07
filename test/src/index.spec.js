const path = require('path')
const _ = require('lodash')
const instance = require('src/index')
const args = require('src/args')
const config = require('src/config')

const fixtures = {
  args: require('test/fixtures/args.js')
}

describe('index', () => {
  describe('getArgs', () => {
    let parseArgsStub
    before(() => {
      parseArgsStub = sinon.stub(args, 'parse', () => { return {} })
    })
    after(() => parseArgsStub.restore())
    it('returns the args object for the instance', () => {
      expect(instance.getArgs()).to.deep.equal({})
    })
  })
  describe('getConfig', () => {
    before(() => {
      config.defaultPath = path.resolve(__dirname, '../fixtures/devlab.yml')
      instance.rawArgs = fixtures.args
    })
    it('returns the full config for the instance from default devlab.yml', () => {
      expect(instance.getConfig()).to.deep.equal(Object.assign(config.load(), args.parse(fixtures.args)))
    })
    it('returns the full config for the instance from arg-specified config path', () => {
      const configPathArgs = _.cloneDeep(fixtures.args)
      configPathArgs.c = path.resolve(__dirname, '../fixtures/devlab.yml')
      instance.rawArgs = configPathArgs
      expect(instance.getConfig()).to.deep.equal(Object.assign(config.load(), args.parse(configPathArgs)))
    })
  })
})
