'use strict'

const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const _ = require('halcyon')

const config = {
  /**
   * @property {string} Default location of binci.yml config file
   */
  defaultPath: `${process.cwd()}/binci.yml`,
  /**
   * Loads config from yaml, attempts to parse to object
   * @param {string} (configPath) Path to config file or use defaultPath
   * @returns {object}
   */
  load: (configPath = config.defaultPath) => {
    try {
      fs.statSync(configPath)
    } catch (err) {
      throw new Error([
        `No config found at ${configPath}.`,
        'Please run `binci init` to create a binci.yml file or specify one with the `-c` flag.'
      ].join(' '))
    }

    let cfg
    try {
      cfg = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'))
    } catch (e) {
      const relPath = path.relative(process.cwd(), configPath)
      const error = new Error(`Please fix the errors in ${relPath}`)
      error.message = error.message + `:\n\n${e.message}`
      throw error
    }
    return config.validate(cfg)
  },
  /**
   * Filters out empty config properties
   * @param {object}
   * @returns {object} 
   */
  validate: (cfg) => _.pipe([
    _.toPairs,
    _.reject(([key, val]) => key !== 'tasks' && key !== 'from' && _.isEmpty(val) || _.isNil(val)),
    _.fromPairs
  ])(cfg)
}

module.exports = config
