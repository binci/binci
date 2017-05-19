'use strict'
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const input = require('input')
const init = require('src/init')

describe('init', () => {
  beforeEach(() => {
    sinon.stub(input, 'text', () => Promise.resolve('foo'))
    sinon.stub(fs, 'writeFileAsync', () => Promise.resolve())
  })
  afterEach(() => {
    input.text.restore()
    fs.writeFileAsync.restore()
  })
  it('rejects if input cannot be read', () => {
    input.text.restore()
    sinon.stub(input, 'text', () => Promise.reject(new Error('foo')))
    return init()
      .catch((err) => {
        expect(err.message).to.equal('Could not read input')
      })
  })
  it('rejects if config file cannot be written', () => {
    fs.writeFileAsync.restore()
    sinon.stub(fs, 'writeFileAsync', () => Promise.reject(new Error('foo')))
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