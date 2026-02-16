import AggregatorStrategy from '../../../lib/processors/aggregator/aggregation-strategy';

import * as sinon from 'sinon';
const sandbox = sinon.createSandbox();

describe('AggragationStrategy', function () {
  class AggregationStrategyTest extends AggregatorStrategy {
    process() { return; }
  }

  afterEach(function () {
    sandbox.restore();
  });

  it('should emit event with status', function () {
    const strategy = new AggregationStrategyTest();
    const event = {};
    const emitStub = sandbox.stub(strategy, 'emit');
    strategy.inject(event, 'status');

    emitStub.args.should.eql([
      ['event', event, 'status']
    ]);
  });
});
