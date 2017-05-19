'use strict'
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const input = require('input')
const init = require('src/init')
const sandbox = require('test/sandbox')

describe('init', () => {
  beforeEach(() => {
    sandbox.stub(input, 'text', () => Promise.resolve('foo'))
    sandbox.stub(fs, 'writeFileAsync', () => Promise.resolve())
  })
  it('rejects if input cannot be read', () => {
    input.text.restore()
    sandbox.stub(input, 'text', () => Promise.reject(new Error('foo')))
    return init()
      .catch((err) => {
        expect(err.message).to.equal('Could not read input')
      })
  })
  it('rejects if config file cannot be written', () => {
    fs.writeFileAsync.restore()
    sandbox.stub(fs, 'writeFileAsync', () => Promise.reject(new Error('foo')))
    return init()
      .catch((err) => {
        expect(err.message).to.equal('Unable to write config file')
      })
  })
  it('accepts image prompt input and writes config file from template and resolves', () => {
    return init()
      .then((res) => {
        expect(res).to.equal('Config file created')
      })
  })
})
