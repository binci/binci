'use strict'

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const input = require('input')

// Initial config template
const configTemplate = (image) => `from: ${image}
# services:
#   - some-service-name:
#       from: some-docker-image
# env:
#   - TMP=\${TMP}
# volumes:
#   - $HOME:/root
# expose:
#   - 8080:8080
# hosts:
#   - some-host.com:127.0.0.1
# before:
#   - echo "before..."
# after:
#   - echo "after..."
tasks:
  env: env | sort
  shell: /bin/sh
`

/**
 * Initializes a project by creating a devlab.yml config
 */
const init = () => input.text('Enter base docker image to use: ')
  .catch(() => {
    throw new Error('Could not read input')
  })
  .then((image) => fs.writeFileAsync(`${process.cwd()}/devlab.yml`, configTemplate(image))
    .then(() => 'Config file created')
    .catch(() => {
      throw new Error('Unable to write config file')
    })
  )

module.exports = init
