/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import services from './../../../src/lib/services';
import { exec } from 'child_process';

describe('services', () => {
  describe('getObj', () => {
    it('returns an object with name and image properties when both are supplied', () => {
      expect(services.getObj('svcName:svcImage')).to.deep.equal({
        name: 'svcName',
        image: 'svcImage'
      });
    });
    it('returns an object with name and image properties when only image is supplied', () => {
      expect(services.getObj('svcImage')).to.deep.equal({
        name: 'svcImage',
        image: 'svcImage'
      });
    });
  });
  describe('startSvc', () => {
    after((done) => {
      exec('docker stop mongotest && docker rm mongotest', (err) => {
        if (!err) {
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
