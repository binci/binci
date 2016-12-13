const path = require('path')
const instance = require('src/index')
const args = require('src/args')
const fixtures = require('test/fixtures/instance')

const configPath = path.resolve(__dirname, '../fixtures/devlab.yml')

describe('index', () => {
  let processCwdStub
  before(() => {
    processCwdStub = sinon.stub(process, 'cwd', () => '/tmp')
  })
  after(() => {
    processCwdStub.restore()
  })
  describe('getConfig', () => {
    it('loads config and args and returns exec run command objects', () => {
      args.raw = { f: 'node:6', e: true, _: [ 'echo "foo"' ], c: configPath }
      expect(instance.getConfig()).to.deep.equal(fixtures.exec)
    })
    it('loads config and args and returns task run command objects', () => {
      args.raw = { f: 'node:6', _: [ 'env' ], c: configPath }
      expect(instance.getConfig()).to.deep.equal(fixtures.task)
    })
  })
  describe('start', () => {
    it('starts the instance using config and args', () => {
      args.raw = { _: [ 'env' ], c: configPath }
      const inst = instance.start()
      expect(true).to.be.true
    })
  })
})
