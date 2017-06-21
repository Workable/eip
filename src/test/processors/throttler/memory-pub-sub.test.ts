import MemoryPubSub from '../../../lib/processors/throttler/memory-pub-sub';
import PubSub from '../../../lib/processors/throttler/pub-sub';
import * as should from 'should';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('MemoryStore', function() {
  let pubSub: MemoryPubSub;

  beforeEach(function() {
    pubSub = new MemoryPubSub(2);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('subscribe', function() {
    it('should mark first event and subscribe to event already in progress', async function() {
      const event = {};
      const event2 = {};
      (await pubSub.subscribe('id', event)).should.equal(false);
      (await pubSub.subscribe('id', event2)).should.equal(true);
    });

    it('should add event to queue', async function() {
      const event = {};
      const event2 = {};
      const event3 = {};
      (await pubSub.subscribe('id', event)).should.equal(false);
      (await pubSub.subscribe('id2', event2)).should.equal(false);
      (await pubSub.subscribe('id3', event3)).should.equal(true);
    });
  });

  describe('timeout', function() {
    it('should reduce counter', async function() {
      const event = {};
      const event2 = {};
      const event3 = {};
      (await pubSub.subscribe('id', event)).should.equal(false);
      (await pubSub.subscribe('id2', event2)).should.equal(false);
      await pubSub.timeout();
      (await pubSub.subscribe('id3', event3)).should.equal(false);
    });
  });

  describe('unsubscribe', function() {
    it('should broadcast that event has been processed', async function() {
      const event = {};
      const event2 = {};
      (await pubSub.subscribe('id', event)).should.equal(false);
      const promise = new Promise(r => {
        pubSub.on(PubSub.PROCESSED, (id, event, result) => {
          event.should.equal(event2);
          result.should.eql('result');
          id.should.eql('id');
          r();
        });
      });
      (await pubSub.subscribe('id', event2)).should.equal(true);
      await pubSub.unsubscribe('id', 'result');
      await promise;
    });
  });
});
