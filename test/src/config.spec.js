const config = require('src/config')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const rimraf = require('rimraf')

describe('config', () => {
  const confPath = path.resolve(__dirname, '/tmp/binci.yml')
  beforeEach(() => {
    sinon.stub(process, 'cwd', () => path.resolve(__dirname, '/tmp'))
    return fs.writeFileAsync(confPath, 'from: node:4\nenv:')
  })
  afterEach((done) => {
    process.cwd.restore()
    rimraf(`${__dirname}/tmp`, done)
  })
  describe('load', () => {
    it('loads the $CWD/binci.yml default config location', () => {
      expect(config.load()).to.be.an('object')
    })
    it('loads the binci.yml from a custom path when specified', () => {
      expect(config.load(confPath)).to.deep.equal({ from: 'node:4' })
    })
    it('exits the process if file cannot be found', () => {
      expect(() => config.load('/no/conf'))
        .to.throw('Please run `binci init` to create a binci.yml file or specify one with the `-c` flag.')
    })
    it('exits the process if file cannot be parsed', () => {
      const error = [
        'Please fix the errors in test/fixtures/binci-syntax-error.yml:',
        '',
        'can not read an implicit mapping pair; a colon is missed at line 13, column 29:',
        '      echo "ruh roh! YLM error!"',
        '                                ^'
      ].join('\n')
      expect(() => config.load('test/fixtures/binci-syntax-error.yml')).to.throw(error)
    })
  })
})
