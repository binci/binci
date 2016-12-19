const utils = require('src/utils')

describe('utils', () => {
  describe('cleanup', () => {
    it('resolves', () => {
      return expect(utils.cleanup()).to.be.fulfilled()
    })
  })
  describe('findOrphans', () => {
    it('resolves', () => {
      return expect(utils.findOrphans()).to.be.fulfilled()
    })
  })
})
