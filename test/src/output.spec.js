const output = require('src/output')

describe('output', () => {
  let logStub
  before(() => {
    logStub = sinon.stub(output, 'log')
  })
  after(() => {
    output.log.restore()
  })
  describe('renderVars', () => {
    it('replaces mustache-bracket delimited vars', () => {
      expect(output.renderVars('this is a {{test}}')).to.equal('this is a \u001b[34mtest\u001b[39m')
    })
  })

  describe('success', () => {
    it('outputs a success message', () => {
      output.success('test-success')
      expect(logStub).to.be.called
    })
  })

  describe('warn', () => {
    it('outputs a warn message', () => {
      output.warn('test-warn')
      expect(logStub).to.be.called
    })
  })

  describe('error', () => {
    it('outputs an error message', () => {
      output.error('test-error')
      expect(logStub).to.be.called
    })
  })

  describe('insertBreak', () => {
    it('outputs a break', () => {
      output.insertBreak()
      expect(logStub).to.be.called
    })
  })
})
