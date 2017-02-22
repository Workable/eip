import Throttler from '../../lib/processors/throttler';
import * as sinon from 'sinon';

const sandbox = sinon.sandbox.create();

describe('Throttler', function () {
  let dispatcher;
  let injectStub: sinon.SinonStub;
  let timers: sinon.SinonFakeTimers;

  beforeEach(function () {
    dispatcher = new Throttler({ id: 'id', input: [2, 2000], name: 'name', previous: null });
    timers = sinon.useFakeTimers();
    injectStub = sandbox.stub(dispatcher, 'inject');
  });

  afterEach(function () {
    sandbox.restore();
    timers.restore();
  });

  describe('process', function () {
    it('should throttle events', async function () {
      const result = await Promise.all([...Array(5).keys()].map(i => dispatcher.process(i)));
      result.should.containDeepOrdered([0, 1, undefined, undefined, undefined]);
      timers.tick(1999);
      await new Promise(r => r());
      injectStub.called.should.be.false();
      timers.tick(1);
      await new Promise(r => r());
      injectStub.calledTwice.should.be.true();
      injectStub.args[0][0]().should.eql(2);
      injectStub.args[1][0]().should.eql(3);

      timers.tick(2000);
      await Promise.resolve();
      await Promise.resolve();
      injectStub.calledThrice.should.be.true();
      injectStub.args[2][0]().should.eql(4);
    });

  });
});
