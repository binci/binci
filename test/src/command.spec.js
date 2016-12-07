const command = require('src/command')

describe('command', () => {
  describe('get', () => {
    it('returns array of command arguments', () => {
      expect(command.get({})).to.be.array
    })
  })
})
