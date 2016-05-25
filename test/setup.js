'use strict'
const chai = require('chai')
const sinon = require('sinon')
const schai = require('sinon-chai')
global.sinon = sinon
global.expect = chai.expect
chai.use(schai)

// Global spies
const output = require('./../src/lib/output')
global.logSpy = sinon.spy(output, 'log')

const proxyquire = require('proxyquire')
global.proxyquire = proxyquire

process.env.LAM_TEST = true
