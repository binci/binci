const proc = require('src/proc')

describe('proc', () => {
  describe('capture', () => {
    it('captures process output to log property', () => {
      proc.capture('err', 'this is an error')
      proc.capture('out', 'this is standard output')
      expect(proc.log).to.equal('ERR: this is an error\nOUT: this is standard output')
    })
  })
  describe('run', () => {
    it('rejects after a process exits with non-0 code', () => {
      return proc.run([ 'foo' ]).then(() => new Error('Should have failed'))
        .catch((code) => {
          expect(proc.log).to.match(/docker: 'foo' is not a docker command/)
        })
    })
    it('resolves when a process runs and exits with 0 code', () => {
      return proc.run([ 'ps' ]).then(() => {
        expect(proc.log).to.match(/CONTAINER ID/)
      })
    })
    it('runs silently if `silent` flag is passed', () => {
      return expect(proc.run([ 'ps' ], true)).to.be.fulfilled()
    })
  })
})
