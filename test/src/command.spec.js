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
  describe('getExec', () => {
    let outputErrorStub
    let processExitStub
    beforeEach(() => {
      outputErrorStub = sinon.stub(output, 'error')
      processExitStub = sinon.stub(process, 'exit')
    })
    afterEach(() => {
      outputErrorStub.restore()
      processExitStub.restore()
    })
    it('returns custom task if exec (-e) was called in arguments', () => {
      expect(command.getExec({ exec: true, task: 'echo "foo"' })).to.deep.equal([ '/bin/sh', '-c', '"echo "foo""' ])
    })
    it('outputs an error and exits if no tasks are specified', () => {
      command.getExec({ task: 'foo' })
      expect(outputErrorStub).to.be.calledWith('Task \'foo\' does not exist')
      expect(processExitStub).to.be.calledWith(1)
    })
    it('outputs an error and exits if invalid task is specified', () => {
      command.getExec({ task: 'foo', tasks: { bar: 'echo "foo"' } })
      expect(outputErrorStub).to.be.calledWith('Task \'foo\' does not exist')
      expect(processExitStub).to.be.calledWith(1)
    })
    it('returns exec task array when all criteria are met', () => {
      const actual = command.getExec({ task: 'foo', tasks: { foo: 'echo "foo"\necho "bar"' } })
      expect(actual).to.deep.equal([ '/bin/sh', '-c', '"echo "foo"; echo "bar""' ])
    })
  })
  describe('get', () => {
    let outputErrorStub
    let processExitStub
    beforeEach(() => {
      outputErrorStub = sinon.stub(output, 'error')
      processExitStub = sinon.stub(process, 'exit')
    })
    afterEach(() => {
      outputErrorStub.restore()
      processExitStub.restore()
    })
    it('outputs error and exits if missing \'from\' property', () => {
      command.get({})
      expect(outputErrorStub).to.be.calledWith('Missing \'from\' property in config or argument')
      expect(processExitStub).to.be.calledWith(1)
    })
  })
})
