import MemoryQueue from '../../../lib/processors/throttler/memory-queue';
import Queue from '../../../lib/processors/throttler/queue';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('MemoryQueue', function() {
  let queue: Queue;

  beforeEach(function() {
    queue = new MemoryQueue();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('enqueue', function() {
    it('should add event to queue', async function() {
      await queue.enqueue('id', 1, 'event');
      (await queue.dequeue()).should.eql(['event']);
    });
  });

  describe('dequeue', function() {
    it('should dequeue same events using priority', async function() {
      await queue.enqueue('id', 5, 'event1');
      await queue.enqueue('id1', 3, 'event2');
      await queue.enqueue('id2', 4, 'event3');
      await queue.enqueue('id3', 2, 'event4');
      await queue.enqueue('id', 5, 'event5');
      await queue.enqueue('id1', 3, 'event6');
      await queue.enqueue('id2', 4, 'event7');
      await queue.enqueue('id3', 2, 'event8');
      await queue.enqueue('id4', 10, 'event9');

      (await queue.dequeue()).should.eql(['event9']);
      (await queue.dequeue()).should.eql(['event1', 'event5']);
      (await queue.dequeue()).should.eql(['event3', 'event7']);
      (await queue.dequeue()).should.eql(['event2', 'event6']);
      (await queue.dequeue()).should.eql(['event4', 'event8']);
    });
  });
});
