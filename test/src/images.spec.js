const images = require('src/images')
const output = require('src/output')
const proc = require('src/proc')
const sandbox = require('test/sandbox')
const path = require('path')
const fs = require('fs')
const Promise = require('bluebird')
const cp = require('child_process')

Promise.promisifyAll(fs)
const knownShaPath = path.resolve(__dirname, '../fixtures/known_sha1.txt')
const knownSha = 'a2ccc6a4b1cfb10bd2970f37b61ef01b2f0f351a'

describe('images', () => {
  beforeEach(() => {
    sandbox.stub(process, 'cwd', () => '/tmp')
    sandbox.stub(output, 'spinner', () => {
      return { succeed: () => null, fail: () => null }
    })
    sandbox.stub(output, 'line')
    sandbox.stub(output, 'success')
    sandbox.stub(output, 'warn')
    sandbox.stub(output, 'error')
  })
  describe('getProjectName', () => {
    it('determines the project name from the current working directory', () => {
      expect(images.getProjectName()).to.equal('tmp')
    })
  })
  describe('getHash', () => {
    it('determines the SHA-1 hash of an existing file', () => {
      return images.getHash(knownShaPath).then(hash => {
        expect(hash).to.equal(knownSha.substr(0, 12))
      })
    })
    it('returns null if the file does not exist', () => {
      return images.getHash(knownShaPath + 'notfound').then(hash => {
        expect(hash).to.be.null()
      })
    })
    it('fails on file read errors', () => {
      return expect(images.getHash(process.cwd())).to.be.rejected()
    })
  })
  describe('getBuiltImages', () => {
    it('gets and processes a list of images', () => {
      sandbox.stub(cp, 'execSync', () => ({ toString: () => (
        '{"tag":"bc_deadbeefbeef","createdAt":"2017-11-07 15:03:13 -0500 EST"}\n' +
        '{"tag":"bc_deadb00fb00f","createdAt":"2017-11-07 15:03:12 -0500 EST"}'
      )}))
      return images.getBuiltImages().then(images => {
        expect(images).to.deep.equal([
          {hash: 'deadbeefbeef', 'createdAt': 1510084993000},
          {hash: 'deadb00fb00f', 'createdAt': 1510084992000}
        ])
      })
    })
    it('returns an empty array when there are no images', () => {
      sandbox.stub(cp, 'execSync', () => ({ toString: () => '' }))
      return images.getBuiltImages().then(images => {
        expect(images).to.deep.equal([])
      })
    })
  })
  describe('deleteImage', () => {
    it('executes the delete command successfully', () => {
      let cmd
      sandbox.stub(cp, 'execSync', (c) => { cmd = c })
      return images.deleteImage('foo').then(() => {
        expect(cmd).to.equal('docker rmi foo')
      })
    })
    it('rejects when delete fails', () => {
      sandbox.stub(cp, 'execSync', () => { throw new Error('test rejection') })
      return expect(images.deleteImage('foo')).to.be.rejected()
    })
  })
  describe('buildImage', () => {
    it('runs the build command successfully', () => {
      let args
      sandbox.stub(proc, 'run', (a) => {
        args = a
        return Promise.resolve()
      })
      return images.buildImage('./Foo', 'bar').then(() => {
        expect(args[2]).to.equal('/tmp/Foo')
        expect(args[4]).to.equal('bar')
      })
    })
    it('rejects when the command fails', () => {
      sandbox.stub(proc, 'run', () => Promise.reject(new Error('test rejection')))
      return expect(images.buildImage('./Foo', 'bar')).to.be.rejected()
    })
  })
  describe('getImage', () => {
    it('returns the name of an existing image when it matches', () => {
      sandbox.stub(images, 'getHash', () => 'deadbeefbeef')
      sandbox.stub(images, 'getBuiltImages', () => [
        {hash: 'deadbeefbeef', createdAt: 1510084993000}
      ])
      return images.getImage().then(id => {
        expect(id).to.equal('tmp:bc_deadbeefbeef')
      })
    })
    it('rejects when the Dockerfile is not found', () => {
      sandbox.stub(images, 'getHash', () => null)
      sandbox.stub(images, 'getBuiltImages', () => [
        {hash: 'deadbeefbeef', createdAt: 1510084993000}
      ])
      return expect(images.getImage()).to.be.rejectedWith(/does not exist/)
    })
    it('builds a new image if the hash is not found', () => {
      sandbox.stub(images, 'getHash', () => 'deadbeefbeef')
      sandbox.stub(images, 'getBuiltImages', () => [])
      const spy = sandbox.stub(images, 'buildImage', (df, name) => Promise.resolve(name))
      return images.getImage('df').then(() => {
        expect(spy).to.be.calledOnce()
        expect(spy).to.be.calledWith('df', 'tmp:bc_deadbeefbeef')
      })
    })
    it('deletes an old image after a successful build', () => {
      sandbox.stub(images, 'getHash', () => 'deadb00fb00f')
      sandbox.stub(images, 'getBuiltImages', () => [
        {hash: 'deadbeefbeef', createdAt: 1510084993000},
        {hash: 'deadbaafbaaf', createdAt: 1510084992000}
      ])
      sandbox.stub(images, 'buildImage', (df, name) => Promise.resolve(name))
      const spy = sandbox.stub(images, 'deleteImage', () => Promise.resolve())
      return images.getImage().then(() => {
        expect(spy).to.be.calledOnce()
        expect(spy).to.be.calledWith('tmp:bc_deadbeefbeef')
      })
    })
  })
})
