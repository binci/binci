const command = require('src/command')
const output = require('src/output')

describe('command', () => {
  describe('parseHostEnvVars', () => {
    before(() => {
      process.env.DL_TEST_EV = 'foo'
    })
    after(() => delete process.env.DL_TEST_EV)
    it('parses a string and returns with replaced host environment variables', () => {
      expect(command.parseHostEnvVars('test-${DL_TEST_EV}')).to.equal('test-foo') // eslint-disable-line no-template-curly-in-string
    })
    it('parses a string and returns with null replace if no host environment variables found', () => {
      expect(command.parseHostEnvVars('test-${DL_TEST_EV_DNE}')).to.equal('test-null') // eslint-disable-line no-template-curly-in-string
    })
  })
  describe('parseArgs', () => {
    it('returns an array of a specific argument type and its values', () => {
      expect(command.parseArgs('expose', [ '8080:8080', '9090:9090' ])).to.deep.equal([ '-p', '8080:8080', '-p', '9090:9090' ])
    })
  })
  describe('getArgs', () => {
    let outputWarnStub
    beforeEach(() => {
      outputWarnStub = sinon.stub(output, 'warn')
    })
    afterEach(() => outputWarnStub.restore())
    it('returns array of all args to run with command based off config', () => {
      expect(command.getArgs({ expose: [ '8080:8080' ], volumes: [ '/tmp:/tmp' ] })).to.deep.equal([ '-p', '8080:8080', '-v', '/tmp:/tmp' ])
    })
    it('outputs a warning if an argument is not an array', () => {
      command.getArgs({ env: 'foo' })
      expect(outputWarnStub).to.be.calledWith('Config error: \'env\' should be an array')
    })
  })
})
