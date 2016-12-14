'use strict'
const output = require('src/output')

describe('output', () => {
  let logSpy
  before(() => {
    logSpy = sinon.spy(console, 'log')
  })
  after(() => {
    logSpy.restore()
  })
  describe('spinner', () => {
    it('starts a spinner for a process', () => {
      expect(output.spinner('test-spinner')).to.be.an('object')
    })
  })
  describe('success', () => {
    it('outputs a success message', () => {
      output.success('test-success')
      expect(logSpy).to.be.called()
    })
  })
  describe('error', () => {
    it('outputs an error message', () => {
      output.error('test-error')
      expect(logSpy).to.be.called()
    })
  })
  describe('line', () => {
    it('outputs a break line', () => {
      output.line()
      expect(logSpy).to.be.called()
    })
  })
})
