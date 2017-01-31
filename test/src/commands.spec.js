'use strict'
const fs = require('fs')
const commands = require('src/commands')
const sinon = require('sinon')

describe('commands', () => {
  describe('tasks', () => {
    const confPath = `${process.cwd()}/devlab.yml`

    before(() => {
      sinon.spy(console, 'log')
      fs.writeFileAsync(confPath, [
        'tasks:',
        '  stuff: echo "stuff" > /dev/null',
        '  lint: eslint .',
        '  ci: stuff test'
      ].join('\n'))
    })

    after(() => {
      console.log.restore()
      fs.unlinkAsync(confPath)
    })

    it('pretty prints all tasks in the config', () => {
      commands.tasks()
      expect(console.log).to.have.been.calledWithExactly([
        '',
        'Tasks:',
        '  stuff    echo "stuff" > /dev/null',
        '  lint     eslint .',
        '  ci       stuff test',
      ].join('\n'))
    })
  })
})
