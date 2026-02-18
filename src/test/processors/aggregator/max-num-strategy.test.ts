import MaxNumStrategy from '../../../lib/processors/aggregator/max-num-strategy';

import * as sinon from 'sinon';
const sandbox = sinon.createSandbox();

describe('AggragationStrategy', function () {
  afterEach(function () {
    sandbox.restore();
  });

  it('should not inject event', function () {
    const strategy = new MaxNumStrategy(2);
    const injectStub = sandbox.stub(strategy, 'inject');
    strategy.process({ body: [1] });

    injectStub.called.should.be.false();
  });

  it('should inject event', function () {
    const strategy = new MaxNumStrategy(2);
    const injectStub = sandbox.stub(strategy, 'inject');
    strategy.process({ body: [1, 2] });

    injectStub.args.should.eql([
      [{ body: [1, 2] }]
    ]);
  });

  it('should not inject event', function () {
    const strategy = new MaxNumStrategy(2);
    const injectStub = sandbox.stub(strategy, 'inject');
    strategy.process({ body: [1, 2, 3] });

    injectStub.called.should.be.false();
  });
});
