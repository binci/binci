'use strict'
const chai = require('chai')
const sinon = require('sinon')
const schai = require('sinon-chai')
const mod = require('module')
const path = require('path')
global.sinon = sinon
global.expect = chai.expect
chai.use(schai)

// Global spies
const output = require('./../src/lib/output')
global.logSpy = sinon.spy(output, 'log')

const proxyquire = require('proxyquire')
global.proxyquire = proxyquire

process.env.LAM_TEST = true

// importing files with ../../../../../.. makes my brain hurt
process.env.NODE_PATH = path.join(__dirname, '..') + path.delimiter + (process.env.NODE_PATH || '')
mod._initPaths()
