/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import services from './../../../src/lib/services';

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
});
