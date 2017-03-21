'use strict'
const tempdir = proxyquire('src/tempdir', {
  'os-tmpdir': () => '/ostmpdir'
})
const fs = require('fs')
const output = require('src/output')

describe('tempdir', () => {
  let outputErrorStub
  let processExitStub
  before(() => {
    outputErrorStub = sinon.stub(output, 'error')
    processExitStub = sinon.stub(process, 'exit')
  })
  after(() => {
    output.error.restore()
    process.exit.restore()
  })
  it('uses DEVLAB_TMP if set and writeable', () => {
    process.env.DEVLAB_TMP = __dirname
    expect(tempdir()).to.equal(__dirname)
    delete process.env.DEVLAB_TMP
  })
  it('uses /tmp if DEVLAB_TMP is not available', () => {
    process.env.DEVLAB_TMP = '/var'
    expect(tempdir()).to.equal('/tmp')
    delete process.env.DEVLAB_TMP
  })
  it('uses /tmp if DEVLAB_TMP not set', () => {
    expect(tempdir()).to.equal('/tmp')
  })
  it('uses os-tmpdir if DEVLAB_TMP and /tmp not available', () => {
    sinon.stub(fs, 'accessSync', (path) => {
      if (path === '/tmp') {
        throw new Error('no dice')
      }
    })
    expect(tempdir()).to.equal('/ostmpdir')
    fs.accessSync.restore()
  })
  it('outputs error and exist if all else fails', () => {
    sinon.stub(fs, 'accessSync', (path) => {
      throw new Error('no dice')
    })
    tempdir()
    expect(outputErrorStub).to.be.calledWith('Could not locate temp dir for writing, please specify DEVLAB_TMP environment variable')
    expect(processExitStub).to.be.calledWith(1)
    fs.accessSync.restore()
  })
})
