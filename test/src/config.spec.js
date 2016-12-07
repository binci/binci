const config = require('src/config')
const output = require('src/output')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

describe('config', () => {
  describe('load', () => {
    const confPath = `${process.cwd()}/devlab.yml`
    before(() => fs.writeFileAsync(confPath, 'from: node:4'))
    after(() => fs.unlinkAsync(confPath))
    it('loads the $CWD/devlab.yml default config location', () => {
      expect(config.load()).to.deep.equal({ from: 'node:4' })
    })
    it('loads the devlab.yml from a custom path when specified', () => {
      expect(config.load(confPath)).to.deep.equal({ from: 'node:4' })
    })
    it('exits the process if file cannot be loaded', () => {
      const procExitStub = sinon.stub(process, 'exit')
      const outputErrorStub = sinon.stub(output, 'error')
      config.load('/no/conf')
      expect(outputErrorStub).to.be.calledWith('Cannot load config file. Please ensure you have a valid ./devlab.yml file or specify one with the `-c` flag')
      expect(procExitStub).to.be.calledWith(1)
      output.error.restore()
      process.exit.restore()
    })
  })
})
