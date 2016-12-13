const config = require('src/config')
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
      expect(() => config.load('/no/conf')).to.throw('Cannot load config file. Please ensure you have a valid ./devlab.yml file or specify one with the `-c` flag')
    })
  })
})
