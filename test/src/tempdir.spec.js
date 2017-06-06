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
  it('uses BINCI_TMP if set and writeable', () => {
    process.env.BINCI_TMP = __dirname
    expect(tempdir()).to.equal(__dirname)
    delete process.env.BINCI_TMP
  })
  it('uses /tmp if BINCI_TMP is not available', () => {
    process.env.BINCI_TMP = '/nope'
    expect(tempdir()).to.equal('/tmp')
    delete process.env.BINCI_TMP
  })
  it('uses /tmp if BINCI_TMP not set', () => {
    delete process.env.BINCI_TMP
    expect(tempdir()).to.equal('/tmp')
  })
  it('uses os-tmpdir if BINCI_TMP and /tmp not available', () => {
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
    expect(outputErrorStub).to.be.calledWith('Could not locate temp dir for writing, please specify BINCI_TMP environment variable')
    expect(processExitStub).to.be.calledWith(1)
    fs.accessSync.restore()
  })
})
