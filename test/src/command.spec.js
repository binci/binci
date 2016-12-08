const command = require('src/command')

describe('command', () => {
  describe('getArgs', () => {
    it('returns array of command arguments', () => {
      expect(command.getArgs({})).to.be.a('array')
    })
  })
})
