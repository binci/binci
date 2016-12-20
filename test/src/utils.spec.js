const utils = require('src/utils')
const fixture = require('test/fixtures/docker-ps')
const proc = require('src/proc')
const output = require('src/output')
const cp = require('child_process')

describe('utils', () => {
  describe('cleanup', () => {
    let cpExecSyncStub
    beforeEach(() => {
      cpExecSyncStub = sinon.stub(cp, 'execSync', (command) => command.indexOf('docker ps') === 0 ? new Buffer(fixture.ids) : '')
    })
    afterEach(() => {
      cp.execSync.restore()
    })
    it('runs stop and rm commands on dl_ prefixed containers', () => {
      utils.cleanup()
      expect(cpExecSyncStub).to.be.calledWith('docker stop 839837sd9d98 && docker rm 839837sd9d98 && docker stop 90488yex73x8 && docker rm 90488yex73x8')
    })
    it('runs stop and rm commands on all containers', () => {
      utils.cleanup(true)
      expect(cpExecSyncStub).to.be.calledWith('docker stop 839837sd9d98 && docker rm 839837sd9d98 && docker stop 90488yex73x8 && docker rm 90488yex73x8')
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
