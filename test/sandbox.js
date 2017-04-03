const sandbox = sinon.sandbox.create()

afterEach(() => {
  sandbox.restore()
})

module.exports = sandbox
