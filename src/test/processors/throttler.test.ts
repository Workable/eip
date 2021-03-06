import Throttler from '../../lib/processors/throttler';
import * as sinon from 'sinon';

const sandbox = sinon.sandbox.create();

const wait = async () => {
  for (let _ of [...Array(10).keys()]) {
    await new Promise(r => r());
  }
};

describe('Throttler', function() {
  let throttler;
  let injectStub: sinon.SinonStub;
  let timers: sinon.SinonFakeTimers;

  beforeEach(function() {
    throttler = new Throttler({ id: 'id', input: [2, 2000], name: 'name', previous: null });
    timers = sinon.useFakeTimers();
    injectStub = sandbox.stub(throttler, 'inject');
  });

  afterEach(function() {
    sandbox.restore();
    timers.restore();
  });

  describe('constructor', function() {
    it('should use defaults', function() {
      const t = new Throttler({ input: [1] });
      t.periodInMS.should.eql(1000);
    });
  });

  describe('process', function() {
    it('should throttle events', async function() {
      const result = await Promise.all([...Array(5).keys()].map(i => throttler.process(i)));
      result.should.containDeepOrdered([0, 1, undefined, undefined, undefined]);
      timers.tick(1999);
      await wait();
      injectStub.called.should.be.false();
      timers.tick(1);
      await wait();
      injectStub.calledTwice.should.be.true();
      injectStub.args[0][0]().should.eql(2);
      injectStub.args[1][0]().should.eql(3);

      timers.tick(2000);
      await wait();
      injectStub.calledThrice.should.be.true();
      injectStub.args[2][0]().should.eql(4);
    });
  });
});
