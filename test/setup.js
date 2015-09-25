import chai from 'chai'
import sinon from 'sinon'
import schai from 'sinon-chai'
global.sinon = sinon
global.expect = chai.expect
chai.use(schai)