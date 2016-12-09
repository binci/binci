const path = require('path')
const _ = require('redash')
const instance = require('src/index')
const args = require('src/args')
const config = require('src/config')

const configPath = path.resolve(__dirname, '../fixtures/devlab.yml')

describe('index', () => {
  describe('getConfig', () => {
    it('loads config from devlab.yml and arguments', () => {
      args.raw = { f: 'node:6', _: [ '/bin/sh' ], c: configPath }
      expect(instance.getConfig()).to.deep.equal(_.merge(config.load(configPath), args.parse()))
    })
  })
  describe('start', () => {
    it('starts the instance using config and args', () => {
      args.raw = { _: [ 'node', 'index.js' ], c: configPath }
      const inst = instance.start()
      console.log(JSON.stringify(inst, null, 4))
      expect(inst).to.be.an('object')
    })
  })
})
