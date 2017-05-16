const utils = require('src/utils')
const sandbox = require('test/sandbox')
const proc = require('src/proc')
const output = require('src/output')
const cp = require('child_process')
const fixtures = {
  ps: require('test/fixtures/docker-ps'),
  v: require('test/fixtures/docker-v')
}

const fixtureIds = fixtures.ps.ids.split('\n').filter(Boolean)
const fixtureAllIds = fixtures.ps.allIds.split('\n').filter(Boolean)

describe('utils', () => {
  describe('cleanup', () => {
    beforeEach(() => {
      sandbox.stub(cp, 'execSync', cmd => {
        return Buffer.from(cmd.includes('--filter="name=dl_"') ? fixtures.ps.ids : fixtures.ps.allIds)
      })
      sandbox.stub(output, 'info')
      sandbox.stub(output, 'error')
      sandbox.stub(output, 'success')
      sandbox.stub(proc, 'run', () => Promise.resolve(''))
    })
    it('outputs "All clean" if there are no containers to cleanup', () => {
      cp.execSync.restore()
      sandbox.stub(cp, 'execSync', () => Buffer.from(''))
      return utils.cleanup().then(() => {
        expect(output.success).to.be.calledWith('All clean')
      })
    })
    it('outputs success with the container id on success', () => {
      cp.execSync.restore()
      proc.run.restore()
      sandbox.stub(cp, 'execSync', () => '123\n')
      sandbox.stub(proc, 'run', () => Promise.resolve())
      return utils.cleanup().then(() => {
        expect(output.success).to.have.been.calledOnce()
        expect(output.success).to.have.been.calledWithExactly('123')
      })
    })
    it('outputs an error on process fail', () => {
      cp.execSync.restore()
      proc.run.restore()
      sandbox.stub(cp, 'execSync', () => '123\n')
      sandbox.stub(proc, 'run', () => Promise.reject())
      return utils.cleanup().then(() => {
        expect(output.error).to.have.been.calledOnce()
        expect(output.error).to.have.been.calledWithExactly('123')
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
      expect(utils.parseOrphans(fixtures.ps.full)).to.deep.equal(['dl_orphan3_JKLod93dS', 'dl_orphan4_MNJ9ie00d'])
    })
  })
  describe('checkOrphans', () => {
    beforeEach(() => {
      sandbox.stub(output, 'warn')
    })
    it('resolves without warning if no orphans are identified', () => {
      sandbox.stub(proc, 'exec', () => Promise.resolve(''))
      return utils.checkOrphans().then(() => {
        expect(output.warn).to.not.be.called()
      })
    })
    it('resolves after warning of identified orphans', () => {
      sandbox.stub(proc, 'exec', () => Promise.resolve(fixtures.ps.full))
      return utils.checkOrphans().then(() => {
        expect(output.warn).to.be.calledWith(
          'These containers may not have exited correctly: dl_orphan3_JKLod93dS, dl_orphan4_MNJ9ie00d')
      })
    })
  })
  describe('checkVersion', () => {
    it('checks Docker version and sets global rmOnShutdown flag', () => {
      sandbox.stub(proc, 'exec', () => Promise.resolve(fixtures.v.current))
      return utils.checkVersion().then(() => {
        expect(global.rmOnShutdown).to.be.false()
      })
    })
    it('checks version and throws error if Docker not installed', () => {
      sandbox.stub(proc, 'exec', () => Promise.reject(new Error()))
      return expect(utils.checkVersion()).to.be.rejectedWith(Error, /Docker not installed/)
    })
  })
})
