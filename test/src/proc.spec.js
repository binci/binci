const proc = require('src/proc')

describe('proc', () => {
  describe('run', () => {
    it('resolves after a process exits with 0-code', () => {
      return expect(proc.run('echo', [ '"foo"' ])).to.be.fulfilled
    })
    it('rejects after a process exits with non-0 code', () => {
      return expect(proc.run('nopers', [])).to.be.rejected
    })
  })
})
