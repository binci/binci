const chai = require('chai')
const sinon = require('sinon')
const pchai = require('chai-as-promised')
const dchai = require('dirty-chai')
const schai = require('sinon-chai')
const mod = require('module')
const path = require('path')
global.sinon = sinon
global.expect = chai.expect
chai.use(pchai)
chai.use(dchai)
chai.use(schai)

global.instanceId = 'test'

process.env.DL_TEST_RUN = true

process.env.NODE_PATH = path.join(__dirname, '..') + path.delimiter + (process.env.NODE_PATH || '')
mod._initPaths()
