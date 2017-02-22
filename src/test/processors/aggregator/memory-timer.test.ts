import MemoryTimer from '../../../lib/processors/aggregator/memory-timer';
import { init, getLogger } from '../../../lib/logger';

import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('Timer', function () {
  let clock;
  before(function () {
    init();
  });

  beforeEach(function () {
    clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    sandbox.restore();
    clock.restore();
  });

  it('should set 2 timeouts', function () {
    const debugStub = sandbox.stub(getLogger(), 'debug');

    const timer = new MemoryTimer([100, 200]);
    const injectStub = sandbox.stub(timer, 'inject');
    timer.start('1');

    clock.tick(100);
    debugStub.args.should.eql([
      [`[memory-timer] [1] timeout-1 after 100 ms`]
    ]);
    injectStub.args.should.eql([
      ['1', 1]
    ]);

    clock.tick(100);
    debugStub.args.should.eql([
      [`[memory-timer] [1] timeout-1 after 100 ms`],
      [`[memory-timer] [1] timeout-2 after 200 ms`]
    ]);

    injectStub.args.should.eql([
      ['1', 1],
      ['1', 2]
    ]);
  });
});
