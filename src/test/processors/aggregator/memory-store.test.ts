import MemoryStore from '../../../lib/processors/aggregator/memory-store';
import * as should from 'should';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('Timer', function () {
  let store: MemoryStore;

  beforeEach(function () {
    store = new MemoryStore();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('append', function () {
    it('should append to new store', function () {
      store.append('1', { id: '1', test: true }, { body: true });
      store.getById('1').should.eql({
        headers: { id: '1', test: true, status: 'INITIAL' },
        body: [{ body: true }]
      });
    });

    it('should append and add headers to existing store', function () {
      store.append('1', { id: '1', test: true, another: false }, { body: true });
      store.append('1', { id: '1', test: false, test2: true }, { body2: true });
      store.getById('1').should.eql({
        headers: { id: '1', test: false, status: 'INITIAL', test2: true, another: false },
        body: [{ body: true }, { body2: true }]
      });
    });
  });

  describe('setStatus', function () {
    it('should throw error for non existing record', function () {
      should.throws(() => store.setStatus('1', 'TEST'), /No entry found for id 1/);
    });

    it('should update status and return', function () {
      store.append('1', { id: '1', test: true }, { body: true });
      const cache = store.setStatus('1', 'TEST');
      cache.should.eql({
        headers: { id: '1', test: true, status: 'TEST', aggregationNum: 1, timeoutNum: 0 },
        body: [{ body: true }]
      });
      store.getById('1').should.equal(cache);
    });

    it('should update status and timeoutNum', function () {
      store.append('1', { id: '1', test: true }, { body: true });
      const cache = store.setStatus('1', 'TIMEOUT');
      cache.should.eql({
        headers: { id: '1', test: true, status: 'TIMEOUT', aggregationNum: 1, timeoutNum: 1 },
        body: [{ body: true }]
      });
      store.getById('1').should.equal(cache);
    });

    it('should update status to COMPLETED and delete it from cache', function () {
      store.append('1', { id: '1', test: true }, { body: true });
      const cache = store.setStatus('1', 'COMPLETED');
      cache.should.eql({
        headers: { id: '1', test: true, status: 'COMPLETED', aggregationNum: 1, timeoutNum: 0 },
        body: [{ body: true }]
      });
      should.equal(undefined, store.getById('1'));
    });
  });
});
