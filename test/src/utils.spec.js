const utils = require('src/utils')
const fixture = require('test/fixtures/docker-ps')
const proc = require('src/proc')
const output = require('src/output')
const cp = require('child_process')

describe('utils', () => {
  describe('cleanup', () => {
    let cpExecSyncStub
    let outputSuccsssStub
    beforeEach(() => {
      cpExecSyncStub = sinon.stub(cp, 'execSync', (command) => command.indexOf('docker ps') === 0 ? new Buffer(fixture.ids) : '')
      outputSuccsssStub = sinon.stub(output, 'success')
      sinon.stub(output, 'info')
    })
    afterEach(() => {
      cp.execSync.restore()
      output.success.restore()
      output.info.restore()
    })
    it('outputs All Clean if there are no containers to cleanup', () => {
      cpExecSyncStub.restore()
      cpExecSyncStub = sinon.stub(cp, 'execSync', () => '')
      utils.cleanup()
      expect(outputSuccsssStub).to.be.calledWith('All clean')
    })
    it('runs stop commands on dl_ prefixed containers', () => {
      utils.cleanup()
      expect(cpExecSyncStub).to.be.calledWith('docker stop 90488yex73x8 >&2 > /dev/null')
    })
    it('runs stop commands on all containers', () => {
      utils.cleanup(true)
      expect(cpExecSyncStub).to.be.calledWith('docker stop 90488yex73x8 >&2 > /dev/null')
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
        expect(outputWarnStub).to.be.calledWith('These containers may not have exited correctly: dl_orphan3_JKLod93dS, dl_orphan4_MNJ9ie00d')
      })
    })
  })
})
