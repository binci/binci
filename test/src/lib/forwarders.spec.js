/* global sinon, expect, request, describe, it, before, after */
import './../../setup';
import _ from 'lodash';
import forwarders from './../../../src/lib/forwarders';
import net from 'net';

describe('forwarders', () => {
  afterEach(() => {
    forwarders._servers = [];
  });
  describe('startForwarder', () => {
    it('proxies a port');
  });
  describe('stopForwarders', () => {
    it('does not error when no forwarders are active', () => {
      forwarders.stopForwarders();
    });
    it('kills active forwarder process');
  });
});
