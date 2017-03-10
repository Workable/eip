import Timer from '../../../lib/processors/aggregator/timer';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('Timer', function () {
  class TimerTest extends Timer {
    start() { return; }
  }

  afterEach(function () {
    sandbox.restore();
  });

  it('should emit event with id and attempt number', function () {
    const timer = new TimerTest([1, 2]);
    const emitStub = sandbox.stub(timer, 'emit');
    timer.inject(1, 1, 1);

    emitStub.args.should.eql([
      ['event', 1, 1, 1]
    ]);
  });
});
