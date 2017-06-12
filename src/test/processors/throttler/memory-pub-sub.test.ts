import MemoryPubSub from '../../../lib/processors/throttler/memory-pub-sub';
import PubSub from '../../../lib/processors/throttler/pub-sub';
import * as should from 'should';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('MemoryStore', function() {
  let pubSub: MemoryPubSub;

  beforeEach(function() {
    pubSub = new MemoryPubSub(2, 2000);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('subscribe', function() {
    it('should mark first event and subscribe to event already in progress', async function() {
      const event = {};
      const event2 = {};
      (await pubSub.subscribe('id', 0, event)).should.equal(false);
      (await pubSub.subscribe('id', 0, event2)).should.equal(true);
    });

    it('should add event to queue', async function() {
      const event = {};
      const event2 = {};
      const event3 = {};
      (await pubSub.subscribe('id', 0, event)).should.equal(false);
      (await pubSub.subscribe('id2', 0, event2)).should.equal(false);
      (await pubSub.subscribe('id3', 0, event3)).should.equal(true);
    });
  });

  describe('unsubscribe', function() {
    it('should broadcast that event has been processed', async function() {
      const event = {};
      const event2 = {};
      (await pubSub.subscribe('id', 0, event)).should.equal(false);
      pubSub.on(PubSub.PROCESSED, (id, result) => {
        result.should.eql('result');
        id.should.eql('id');
      });
      (await pubSub.subscribe('id', 0, event2)).should.equal(true);
      await pubSub.unsubscribe('id', 'result');
    });
  });
});
