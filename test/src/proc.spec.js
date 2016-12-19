const proc = require('src/proc')
const cp = require('child_process')

describe('proc', () => {
  describe('run', () => {
    it('rejects after a process exits with non-0 code', () => {
      return expect(proc.run([ 'foo' ])).to.be.rejected()
    })
    it('resolves when a process runs and exits with 0 code', () => {
      return expect(proc.run([ 'ps' ])).to.be.fulfilled()
    })
    it('runs silently if `silent` flag is passed', () => {
      return expect(proc.run([ 'ps' ], true)).to.be.fulfilled()
    })
  })
  describe('runDetached', () => {
    let cpSpawnStub
    beforeEach(() => {
      cpSpawnStub = sinon.stub(cp, 'spawn', function () { return { unref: () => null } })
    })
    afterEach(() => cpSpawnStub.restore())
    it('runs a detached process', () => {
      proc.runDetached('echo "foo"')
      expect(cpSpawnStub).to.be.calledWith('sh', [ '-c', 'echo "foo"' ])
    })
  })
})
