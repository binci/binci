import fs from 'fs';
import chai from 'chai';
import sinon from 'sinon';
import schai from 'sinon-chai';
global.sinon = sinon;
global.expect = chai.expect;
chai.use(schai);

// Global spies
import output from './../src/lib/output';
global.logSpy = sinon.spy(output, 'log');

/*let logFile = fs.createWriteStream('./test.log', {
    encoding: 'utf8',
    flags   : 'a'
});
global.process.stdout.pipe(logFile);

process.stdout.write = () => null;
*/