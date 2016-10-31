'use strict'
const chai = require('chai')
const sinon = require('sinon')
const schai = require('sinon-chai')
const mod = require('module')
const path = require('path')
global.sinon = sinon
global.expect = chai.expect
chai.use(schai)

const proxyquire = require('proxyquire')
global.proxyquire = proxyquire

process.env.NODE_PATH = path.join(__dirname, '..') + path.delimiter + (process.env.NODE_PATH || '')
mod._initPaths()
