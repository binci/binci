/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import services from './../../../src/lib/services';
import { exec } from 'child_process';

describe('services', () => {
  describe('getSvcObj', () => {
    it('returns an object with properties of service', () => {
      expect(services.getSvcObj({ testImage: { name: 'testSvc' } })).to.deep.equal({
        name: 'testSvc',
        image: 'testImage',
        env: false,
        persist: true
      });
    });
  });
  describe('getArgs', () => {
    it('returns array of arguments required to run service', () => {
      expect(services.getArgs({ name: 'testSvc', image: 'testImage' })).to.deep.equal([
        '--name',
        'testSvc',
        'testImage'
      ]);
    });
  });
  describe('startSvc', () => {
    after((done) => {
      exec('docker stop mongotest && docker rm mongotest', (err) => {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });
    it('starts a service based on the object passed', (done) => {
      services.startSvc({ name: 'mongotest', image: 'mongo' })
        .then(done)
        .catch(done);
    });
    it('resolves if service is already started', (done) => {
      services.startSvc({ name: 'mongotest', image: 'mongo' })
        .then(done)
        .catch(done);
    });
    it('fails if invalid service is passed', (done) => {
      services.startSvc({ name: 'noimage', image: 'noimage12345' })
        .then(() => {
          done('Should have failed');
        })
        .catch(() => {
          done();
        });
    });
  });
});
