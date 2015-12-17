import parsers from './../../../src/lib/parsers'
import testManifests from './../../fixtures/manifests'
import config from './../../../src/lib/config'
import username from 'username'

describe('parsers', () => {
  describe('parseHostEnvVars', () => {
    it('parses and replaces ${..} delimited environment variables', () => {
      process.env.FOO = 'bar'
      const result = parsers.parseHostEnvVars('${FOO}')
      expect(result).to.equal('bar')
    })
  })
  describe('parseHostMap', () => {
    it('parses a host map', () => {
      const args = parsers.parseHostMap({ foo: '0.0.0.0' })
      expect(args).to.deep.equal([ '--add-host', 'foo:0.0.0.0' ])
    })
  })
  describe('parseEnvVars', () => {
    it('processes an array of env vars and returns arguments', () => {
      const result = parsers.parseEnvVars([ 'FOO=bar', 'LAM_TEST=${LAM_TEST}' ])
      expect(result).to.deep.equal([ '-e', 'FOO=bar', '-e', 'LAM_TEST=true' ])
    })
  })
  describe('parseExpose', () => {
    it('processes an array of ports and returns arguments', () => {
      const result = parsers.parseExpose([ '8080:8080' ])
      expect(result).to.deep.equal([ '-p', '8080:8080' ])
    })
  })
  describe('parseForwardedPorts', () => {
    it('collects all locally exposed ports in a manifest', () => {
      const result = parsers.parseForwardedPorts(testManifests.multiExpose)
      expect(result).to.be.an.Array
      expect(result).to.include(8181)
      expect(result).to.include(8282)
      expect(result).to.include(7000)
      expect(result).to.include(3306)
      expect(result).to.have.length(4)
    })
  })
  describe('parseVolumes', () => {
    it('processes an array of volumes and returns arguments', () => {
      const result = parsers.parseVolumes([ '/testHost:/testGuest' ])
      expect(result).to.deep.equal([ '-v', '/testHost:/testGuest' ])
    })
  })
  describe('parseSvcObj', () => {
    it('returns an object with properties of service', () => {
      const user = username.sync() || 'unknown'
      expect(parsers.parseSvcObj({ testImage: { name: 'testSvc' } })).to.deep.equal({
        name: `devlab_testsvc_${user}_${config.instance}`,
        alias: 'testSvc',
        image: 'testImage',
        env: false,
        expose: false,
        persist: true,
        exec: false,
        links: false
      })
    })
  })
  describe('parseTask', () => {
    it('returns semicolon split executable task command', () => {
      expect(parsers.parseTask('a\nb\nc')).to.equal('a; b; c')
    })
  })
  describe('parseAliases', () => {
    it('parses dot-prefixed aliases and replaces with task commands', () => {
      const mockManifest = {
        tasks: {
          'foo': 'bar'
        }
      }
      expect(parsers.parseAliases(mockManifest, '.foo')).to.equal('bar;')
    })
  })
})
