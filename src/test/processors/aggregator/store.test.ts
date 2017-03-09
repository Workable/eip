import Store from '../../../lib/processors/aggregator/store';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('Store', function () {
  class StoreTest extends Store {
    async getById() { return; }
    async append() { return; }
    async setStatus() { return; }
  }

  afterEach(function () {
    sandbox.restore();
  });

  it('should create new store', function () {
    const store = new StoreTest();
    (<any>store).constructor.STATUS.should.eql({
      INITIAL: 'INITIAL',
      TIMEOUT: 'TIMEOUT',
      OTHER: 'OTHER',
      COMPLETED: 'COMPLETED',
    });
  });
});
