const proc = require('src/proc')

describe('proc', () => {
  describe('run', () => {
    beforeEach(() => {
      proc.log = '' // Reset logs
    })
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
})
