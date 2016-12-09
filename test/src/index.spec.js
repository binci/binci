const path = require('path')
const _ = require('redash')
const instance = require('src/index')
const args = require('src/args')
const config = require('src/config')

describe('index', () => {
  describe('getConfig', () => {
    it('loads config from devlab.yml and arguments', () => {
      const configPath = path.resolve(__dirname, '../fixtures/devlab.yml')
      args.raw = { f: 'node:6', _: [ '/bin/sh' ], c: configPath }
      expect(instance.getConfig()).to.deep.equal(_.merge(config.load(configPath), args.parse()))
    })
  })
  describe('start', () => {
    it('starts the instance using config and args', () => {
      const inst = instance.start()
      expect(inst).to.be.true
    })
  })
})
