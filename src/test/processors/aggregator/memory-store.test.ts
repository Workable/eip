import MemoryStore from '../../../lib/processors/aggregator/memory-store';
import * as should from 'should';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('MemoryStore', function () {
  let store: MemoryStore;

  beforeEach(function () {
    store = new MemoryStore();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('append', function () {
    it('should append to new store', async function () {
      await store.append('1', { id: '1', test: true }, { body: true });
      (await store.getById('1')).should.eql({
        headers: { id: '1', test: true, status: 'INITIAL' },
        body: [{ body: true }]
      });
    });

    it('should append and add headers to existing store', async function () {
      await store.append('1', { id: '1', test: true, another: false }, { body: true });
      await store.append('1', { id: '1', test: false, test2: true }, { body2: true });
      (await store.getById('1')).should.eql({
        headers: { id: '1', test: false, status: 'INITIAL', test2: true, another: false },
        body: [{ body: true }, { body2: true }]
      });
    });
  });

  describe('setStatus', function () {
    it('should throw error for non existing record', async function () {
      await store.setStatus('1', 'TEST')
        .catch(e => e.should.eql(new Error('No entry found for id \'1\'')));
    });

    it('should update status and return', async function () {
      await store.append('1', { id: '1', test: true }, { body: true });
      const cache = await store.setStatus('1', 'TEST');
      cache.should.eql({
        headers: { id: '1', test: true, status: 'TEST', aggregationNum: 1, timeoutNum: 0 },
        body: [{ body: true }]
      });
      (await store.getById('1')).should.equal(cache);
    });

    it('should update status and timeoutNum', async function () {
      await store.append('1', { id: '1', test: true }, { body: true });
      const cache = await store.setStatus('1', 'TIMEOUT');
      cache.should.eql({
        headers: { id: '1', test: true, status: 'TIMEOUT', aggregationNum: 1, timeoutNum: 1 },
        body: [{ body: true }]
      });
      (await store.getById('1')).should.equal(cache);
    });

    it('should update status to COMPLETED and delete it from cache', async function () {
      await store.append('1', { id: '1', test: true }, { body: true });
      const cache = await store.setStatus('1', 'COMPLETED');
      cache.should.eql({
        headers: { id: '1', test: true, status: 'COMPLETED', aggregationNum: 1, timeoutNum: 0 },
        body: [{ body: true }]
      });
      should.equal(undefined, await store.getById('1'));
    });
  });
});
