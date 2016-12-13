'use strict'
const command = require('src/command')

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
    it('returns array of all args to run with command based off config', () => {
      expect(command.getArgs({ expose: [ '8080:8080' ], volumes: [ '/tmp:/tmp' ] })).to.deep.equal([ '-p', '8080:8080', '-v', '/tmp:/tmp' ])
    })
    it('outputs a warning if an argument is not an array', () => {
      expect(() => command.getArgs({ env: 'foo' })).to.throw('Config error: \'env\' should be an array')
    })
  })
  describe('formatTask', () => {
    it('returns single line format task', () => {
      expect(command.formatTask('foo\nbar')).to.equal('foo; bar')
    })
  })
  describe('getExec', () => {
    it('returns custom task if exec (-e) was called in arguments', () => {
      expect(command.getExec({ exec: 'echo "foo"' })).to.deep.equal([ 'sh', '-c', 'echo "foo"' ])
    })
    it('throws error if no tasks are specified', () => {
      expect(() => command.getExec({ task: 'foo' })).to.throw('Task \'foo\' does not exist')
    })
    it('throws error if invalid task is specified', () => {
      expect(() => command.getExec({ task: 'foo', tasks: { bar: 'echo "foo"' } })).to.throw('Task \'foo\' does not exist')
    })
    it('returns exec task array when all criteria are met', () => {
      const actual = command.getExec({ task: 'foo', before: 'bar', after: 'bizz', tasks: { foo: 'echo "foo"\necho "bar"' } })
      expect(actual).to.deep.equal([ 'sh', '-c', 'bar; echo "foo"; echo "bar"; bizz' ])
    })
  })
  describe('getLinks', () => {
    it('returns an empty array if no services are present', () => {
      expect(command.getLinks({})).to.deep.equal([])
    })
    it('returns formatted link arguments if services are present', () => {
      expect(command.getLinks({ services: [ { foo: {} }, { bar: {} } ] })).to.deep.equal([ '--link', 'dl_foo:foo', '--link', 'dl_bar:bar' ])
    })
  })
  describe('get', () => {
    let processCwdStub
    beforeEach(() => {
      processCwdStub = sinon.stub(process, 'cwd', () => '/tmp')
    })
    afterEach(() => {
      processCwdStub.restore()
    })
    it('throws error if missing \'from\' property', () => {
      expect(() => command.get({})).to.throw('Missing \'from\' property in config or argument')
    })
    it('returns array of arguments for a service config', () => {
      process.env.DL_TEST_EV = 'foo'
      const actual = command.get({ from: 'mongo', env: [ 'DL_TEST_EV=${DL_TEST_EV}' ], expose: [ '8080:8080', '9090:9090' ] }, 'mongo_test') // eslint-disable-line no-template-curly-in-string
      expect(actual).to.deep.equal([ 'run', '-d', '--privileged', '-e', 'DL_TEST_EV=foo', '-p', '8080:8080', '-p', '9090:9090', '--name', 'dl_mongo_test', 'mongo' ])
      delete process.env.DL_TEST_EV
    })
    it('returns array of arguments for a primary container config', () => {
      process.env.DL_TEST_EV = 'foo'
      const actual = command.get({ from: 'mongo', env: [ 'DL_TEST_EV=${DL_TEST_EV}' ], expose: [ '8080:8080' ], task: 'foo', tasks: { foo: 'echo "foo"' } }, 'primary', true) // eslint-disable-line no-template-curly-in-string
      expect(actual).to.deep.equal([ 'run', '--rm', '-it', '-v', '/tmp:/tmp', '-w', '/tmp', '--privileged', '-e', 'DL_TEST_EV=foo', '-p', '8080:8080', '--name', 'dl_primary', 'mongo', 'sh', '-c', 'echo "foo"' ])
      delete process.env.DL_TEST_EV
    })
  })
})
