import MemoryTimer from '../../../lib/processors/aggregator/memory-timer';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('Timer', function () {
  let clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    sandbox.restore();
    clock.restore();
  });

  it('should set 2 timeouts', function () {

    const timer = new MemoryTimer([100, 200]);
    const injectStub = sandbox.stub(timer, 'inject');
    timer.start('1');

    clock.tick(100);
    injectStub.args.should.eql([
      ['1', 1, 100]
    ]);

    clock.tick(100);

    injectStub.args.should.eql([
      ['1', 1, 100],
      ['1', 2, 200]
    ]);
  });
});
