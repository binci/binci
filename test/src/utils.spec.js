const utils = require('src/utils')
const fixture = require('test/fixtures/docker-ps')
const proc = require('src/proc')
const output = require('src/output')
const cp = require('child_process')

const fixtureIds = fixture.ids.split('\n').filter(Boolean)
const fixtureAllIds = fixture.allIds.split('\n').filter(Boolean)

describe('utils', () => {
  describe('cleanup', () => {
    beforeEach(() => {
      sinon.stub(cp, 'execSync', cmd => {
        return Buffer.from(cmd.includes('--filter="name=dl_"') ? fixture.ids : fixture.allIds)
      })
      sinon.stub(proc, 'run', () => Promise.resolve(''))
      sinon.stub(output, 'success')
      sinon.stub(output, 'info')
    })
    afterEach(() => {
      cp.execSync.restore()
      proc.run.restore()
      output.success.restore()
      output.info.restore()
    })
    it('outputs "All clean" if there are no containers to cleanup', () => {
      cp.execSync.restore()
      sinon.stub(cp, 'execSync', () => Buffer.from(''))
      return utils.cleanup().then(() => {
        expect(output.success).to.be.calledWith('All clean')
      })
    })
    it('runs stop commands on dl_ prefixed containers', () => {
      return utils.cleanup().then(() => {
        expect(proc.run.callCount).to.equal(2)

        fixtureIds.forEach((id, index) => {
          expect(proc.run.getCall(index)).to.be.calledWithExactly(['stop', id], true)
        })
      })
    })
    it('runs stop commands on all containers', () => {
      return utils.cleanup(true).then(() => {
        expect(proc.run.callCount).to.equal(7)
        fixtureAllIds.forEach((id, index) => {
          expect(proc.run.getCall(index)).to.be.calledWithExactly(['stop', id], true)
        })
      })
    })
  })
  describe('parseOrphans', () => {
    it('returns array of orphaned containers', () => {
      expect(utils.parseOrphans(fixture.full)).to.deep.equal(['dl_orphan3_JKLod93dS', 'dl_orphan4_MNJ9ie00d'])
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
        expect(outputWarnStub).to.be.calledWith(
          'These containers may not have exited correctly: dl_orphan3_JKLod93dS, dl_orphan4_MNJ9ie00d')
      })
    })
  })
})
