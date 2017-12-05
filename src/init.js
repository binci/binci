'use strict'

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const input = require('input')

// Initial config template
const configTemplate = (containerLine) => `${containerLine}
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
# before: |
#   echo "before..."
# after: |
#   echo "after..."
tasks:
  env: env | sort
  shell: /bin/sh
`

/**
 * Initializes a project by creating a binci.yml config
 */
const init = () => input.text('Enter base docker image to use, or press enter to build ./Dockerfile: ')
  .catch(() => {
    throw new Error('Could not read input')
  })
  .then((answer) => {
    const line = answer ? `from: ${answer}` : 'dockerfile: ./Dockerfile'
    return fs.writeFileAsync(`${process.cwd()}/binci.yml`, configTemplate(line))
      .then(() => 'Config file created')
      .catch(() => {
        throw new Error('Unable to write config file')
      })
  })

module.exports = init
