const config = require('src/config')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

describe('config', () => {
  describe('load', () => {
    const confPath = `${process.cwd()}/devlab.yml`
    beforeEach(() => fs.writeFileAsync(confPath, 'from: node:4'))
    afterEach(() => fs.unlinkAsync(confPath))
    it('loads the $CWD/devlab.yml default config location', () => {
      expect(config.load()).to.deep.equal({ from: 'node:4' })
    })
    it('loads the devlab.yml from a custom path when specified', () => {
      expect(config.load(confPath)).to.deep.equal({ from: 'node:4' })
    })
    it('exits the process if file cannot be found', () => {
      expect(() => config.load('/no/conf'))
        .to.throw('Please run `devlab init` to create a devlab.yml file or specify one with the `-c` flag.')
    })
    it('exits the process if file cannot be parsed', () => {
      const error = [
        'Please fix the errors in test/fixtures/devlab-syntax-error.yml:',
        '',
        'can not read an implicit mapping pair; a colon is missed at line 13, column 29:',
        '      echo "ruh roh! YLM error!"',
        '                                ^'
      ].join('\n')
      expect(() => config.load('test/fixtures/devlab-syntax-error.yml')).to.throw(error)
    })
  })
})
