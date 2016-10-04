'use strict'
const manifest = {}

manifest.from = 'from'
manifest.run = 'run'

// config
const getStub = sinon.stub().returns(manifest)
// forwarders
const startForwardersStub = sinon.stub()
const stopForwardersStub = sinon.stub().returns(Promise.resolve())
// output
const errorStub = sinon.stub()
const successStub = sinon.stub()
// parsers
const parseForwardedPortsStub = sinon.stub()
const parseEnvVarsStub = sinon.stub()
const parseExposeStub = sinon.stub()
const parseVolumesStub = sinon.stub()
const parseHostMapStub = sinon.stub()
// process
const exitStub = sinon.stub()
// lib/process
const procStub = sinon.stub()
// services
const runStub = sinon.stub()
const stopServicesStub = sinon.stub()
// usernane
const syncStub = sinon.stub().returns('testusername')
// url
const testUrlHostname = 'testhostname'
const parseStub = sinon.stub().returns({ hostname: testUrlHostname })

const core = proxyquire('./../src/index', {
  './lib/config': {
    get: getStub,
    instance: 'instance',
    manifest: {
      username: 'manifestUsername'
    }
  },
  './lib/forwarders': {
    startForwarders: startForwardersStub,
    stopForwarders: stopForwardersStub
  },
  './lib/output': {
    error: errorStub,
    success: successStub
  },
  './lib/parsers': {
    parseForwardedPorts: parseForwardedPortsStub,
    parseEnvVars: parseEnvVarsStub,
    parseExpose: parseExposeStub,
    parseVolumes: parseVolumesStub,
    parseHostMap: parseHostMapStub
  },
  './lib/process': procStub,
  './lib/services': {
    run: runStub,
    stopServices: stopServicesStub
  },
  'username': {
    sync: syncStub
  },
  'url': {
    parse: parseStub
  }
})

describe('core', () => {
  let originalProcessExit

  beforeEach(() => {
    [
      getStub,
      startForwardersStub,
      stopForwardersStub,
      parseForwardedPortsStub,
      parseEnvVarsStub,
      parseExposeStub,
      parseVolumesStub,
      parseHostMapStub,
      procStub,
      errorStub,
      successStub,
      runStub,
      stopServicesStub,
      syncStub,
      parseStub,
      exitStub
    ].forEach(stub => stub.reset())
    process.env.DOCKER_HOST = ''
    originalProcessExit = process.exit
    process.exit = exitStub

    runStub.returns(Promise.resolve())
    parseEnvVarsStub.returns([])

    manifest.workdir = '/testworkdir'
  })

  afterEach(() => process.exit = originalProcessExit)

  describe('run', () => {
    describe('manifest', () => {
      it('gets the manifest from the config', done => {
        core.run()
          .then(() => {
            expect(getStub).to.have.been.calledOnce
          })
          .then(done).catch(done)
      })

      it('gets the username from the sync method of username module', done => {
        core.run()
          .then(() => {
            expect(syncStub).to.have.been.calledOnce
          })
          .then(done).catch(done)
      })
    })

    describe('the process', () => {
      it('calls docker with the proper default arguements and outputs success message', done => {
        core.run()
          .then(() => {
            expect(successStub.args[0][0]).to.equal('Running container {{from}}, task {{run}}')
            expect(procStub.args[0][0]).to.equal('docker')
            expect(procStub.args[0][1]).to.eql([
              'run',
              '--privileged',
              '-it',
              '--rm',
              '-v',
              [manifest.workdir, manifest.workdir].join(':'),
              '-w',
              manifest.workdir,
              '--name',
              'devlab_' + manifest.workdir.replace(/^\//, '') + '_manifestusername_instance',
              'from',
              'sh',
              '-c',
              'run'
            ])
          })
          .then(done).catch(done)
      })
    })

    describe('port forwarding', () => {
      it('does not attempt to start any ports if non are provided', done => {
        core.run()
          .then(() => {
            expect(startForwardersStub).to.not.have.been.called
          })
          .then(done).catch(done)
      })

      it('uses manifest ports if they are provided and if DOCKER_HOST env var is set', done => {
        const ports = [5000, 5001, 5555]
        process.env.DOCKER_HOST = 'testdockerhost'
        parseForwardedPortsStub.returns(ports)
        core.run()
          .then(() => {
            expect(parseStub.args[0][0]).to.equal(process.env.DOCKER_HOST)
            expect(startForwardersStub.args[0][0]).to.equal(testUrlHostname, ports)
          })
          .then(done).catch(done)
      })
    })

    describe('building arguments', () => {
      it('uses manifest env vars when provided', done => {
        manifest.env = 'env'
        parseEnvVarsStub.withArgs(manifest.env).returns(['-e', 'testEnvVar=testEnvVarValue'])
        core.run()
          .then(() => {
            const eIndex = procStub.args[0][1].indexOf('-e')
            expect(procStub.args[0][1][eIndex + 1]).to.equal('testEnvVar=testEnvVarValue')
          })
          .then(done).catch(done)
      })

      it('uses manifest ports when provided', done => {
        manifest.expose = 5000
        parseExposeStub.withArgs(manifest.expose).returns(['-p', manifest.expose])
        core.run()
          .then(() => {
            const pIndex = procStub.args[0][1].indexOf('-p')
            expect(procStub.args[0][1][pIndex + 1]).to.equal(manifest.expose)
          })
          .then(done).catch(done)
      })

      it('uses manifest volumes when provided', done => {
        manifest.hosts = { host: '127.0.0.1' }
        parseHostMapStub.withArgs(manifest.hosts).returns(['--add-host', 'host:127.0.0.1'])
        core.run()
          .then(() => {
            const addHostIndex = procStub.args[0][1].indexOf('--add-host')
            expect(procStub.args[0][1][addHostIndex + 1]).to.equal('host:127.0.0.1')
          })
          .then(done).catch(done)
      })

      it('uses interactive mode when provided', done => {
        manifest.interactive = false
        process.stdout.isTTY = false
        core.run()
          .then(() => {
            process.stdout.isTTY = true
            expect(procStub.args[0][1].indexOf('-t') !== -1).to.be.true
          })
          .then(done).catch(done)
      })

      it('does not clean up docker when no rm provided', done => {
        process.env.DEVLAB_NO_RM = false
        core.run()
          .then(() => {
            expect(procStub.args[0][1].indexOf('--rm') !== -1).to.be.true
          })
          .then(done).catch(done)
      })

      it('sets the workdir and volume', done => {
        process.env.DEVLAB_NO_RM = false
        core.run()
          .then(() => {
            const vIndex = procStub.args[0][1].indexOf('-v')
            const wIndex = procStub.args[0][1].indexOf('-w')
            expect(procStub.args[0][1][vIndex + 1]).to.equal(`${manifest.workdir}:${manifest.workdir}`)
            expect(procStub.args[0][1][wIndex + 1]).to.equal(manifest.workdir)
          })
          .then(done).catch(done)
      })
    })

    describe('starting services', () => {
      beforeEach(() => {
        manifest.services = ['svc1', 'svc2', 'svc3', 'svc4']
        runStub.withArgs(manifest.services).returns(Promise.resolve(manifest.services))
      })

      it('calls docker with the proper service link arguements', done => {
        core.run()
          .then(() => {
            [4, 6, 8, 10].forEach(i => expect(procStub.args[0][1][i]).to.equal('--link'))
            expect(procStub.args[0][1][5]).to.equal('svc1')
            expect(procStub.args[0][1][7]).to.equal('svc2')
            expect(procStub.args[0][1][9]).to.equal('svc3')
            expect(procStub.args[0][1][11]).to.equal('svc4')
          })
          .then(done).catch(done)
      })

      it('outputs an error and throws code one when services.run rejects', done => {
        manifest.services = 'error'
        runStub.withArgs('error').returns(Promise.reject('test output error'))
        core.run()
          .then(() => {
            expect(errorStub).to.have.been.calledWith('test output error')
            manifest.services = ['svc1', 'svc2', 'svc3', 'svc4']
          })
          .then(done).catch(done)
      })
    })

    describe('tearDown', () => {
      it('stops port forwarders and services and exits the process with status code 0', done => {
        core.run()
          .then(() => {
            expect(stopForwardersStub).to.have.been.calledOnce
            expect(stopServicesStub).to.have.been.calledOnce
            expect(exitStub).to.have.been.calledOnce
            expect(exitStub).to.have.been.calledWith(0)
          })
          .then(done).catch(done)
      })
    })
  })
})
