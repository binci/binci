const utils = require('src/utils')
const fixture = require('test/fixtures/docker-ps')
const proc = require('src/proc')
const output = require('src/output')

describe('utils', () => {
  describe('cleanup', () => {
    it('resolves', () => {
      return expect(utils.cleanup()).to.be.fulfilled()
    })
  })
  describe('parseOrphans', () => {
    it('returns array of orphaned containers', () => {
      expect(utils.parseOrphans(fixture.full)).to.deep.equal([ 'dl_orphan3_JKLod93dS', 'dl_orphan4_MNJ9ie00d' ])
    })
  })
  describe('checkOrphans', () => {
    let outputWarnStub
    beforeEach(() => {
      outputWarnStub = sinon.stub(output, 'warn')
    })
    afterEach(() => {
      if (proc.exec.restore) proc.exec.restore()
      output.warn.restore()
    })
    it('resolves without warning if no orphans are identified', () => {
      sinon.stub(proc, 'exec', () => Promise.resolve(''))
      return utils.checkOrphans().then(() => {
        expect(outputWarnStub).to.not.be.called()
      })
    })
    it('resolves after warning of identified orphans', () => {
      sinon.stub(proc, 'exec', () => Promise.resolve(fixture.full))
      return utils.checkOrphans().then(() => {
        expect(outputWarnStub).to.be.calledWith('The following containers may not have shut down correctly: dl_orphan3_JKLod93dS, dl_orphan4_MNJ9ie00d')
      })
    })
  })
})
