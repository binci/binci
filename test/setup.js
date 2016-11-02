const chai = require('chai')
const sinon = require('sinon')
const schai = require('sinon-chai')
const mod = require('module')
const path = require('path')
global.sinon = sinon
global.expect = chai.expect
chai.use(schai)

process.env.NODE_PATH = path.join(__dirname, '..') + path.delimiter + (process.env.NODE_PATH || '')
mod._initPaths()
