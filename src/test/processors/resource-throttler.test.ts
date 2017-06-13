import Throttler from '../../lib/processors/resource-throttler';
import * as sinon from 'sinon';
import { init, getLogger } from '../../lib/logger';

const sandbox = sinon.sandbox.create();

const wait = async () => {
  for (let _ of [...Array(10).keys()]) {
    await new Promise(r => r());
  }
};

describe('ResourceThrottler', function() {
  let throttler;
  let injectStub: sinon.SinonStub;
  let timers: sinon.SinonFakeTimers;
  let resource: sinon.SinonStub;
  let infoStub;
  let debugStub;

  before(function() {
    init();
  });

  beforeEach(function() {
    resource = sandbox.stub().returns({});
    throttler = new Throttler({
      id: 'id',
      input: [{ eventsPerPeriod: 2, periodInMS: 2000, resource }],
      name: 'name',
      previous: null
    });
    timers = sinon.useFakeTimers();
    injectStub = sandbox.stub(throttler, 'inject');
    infoStub = sandbox.stub(getLogger(), 'info');
    debugStub = sandbox.stub(getLogger(), 'debug');
  });

  afterEach(function() {
    sandbox.restore();
    timers.restore();
  });

  describe('constructor', function() {
    it('should use defaults', function() {
      const t = new Throttler({ input: [] });
      t.timer.delays.should.eql([1000]);
      t.pubSub.eventsPerPeriod.should.eql(1);
      t.resource(5).should.eql(5);
    });
  });

  describe('process', function() {
    it('should throttle events', async function() {
      const result = Promise.all(
        [...Array(5).keys()].map(i => throttler.process({ headers: { correlationId: i, id: i } }))
      );
      result.should.containDeepOrdered([undefined, undefined, undefined, undefined, undefined]);
      await wait();
      timers.tick(1999);
      await wait();
      resource.args.should.eql([
        [{ headers: { correlationId: 0, id: 0 } }],
        [{ headers: { correlationId: 1, id: 1 } }]
      ]);
      injectStub.args.map(x => x.map(y => y())).should.eql([[{ headers: { id: 0 } }], [{ headers: { id: 1 } }]]);
      timers.tick(1);
      await wait();
      resource.args.should.eql([
        [{ headers: { correlationId: 0, id: 0 } }],
        [{ headers: { correlationId: 1, id: 1 } }],
        [{ headers: { correlationId: 2, id: 2 } }],
        [{ headers: { correlationId: 3, id: 3 } }]
      ]);
      injectStub.args
        .map(x => x.map(y => y()))
        .should.eql([
          [{ headers: { id: 0 } }],
          [{ headers: { id: 1 } }],
          [{ headers: { id: 2 } }],
          [{ headers: { id: 3 } }]
        ]);
      timers.tick(2000);
      await wait();
      resource.args.should.eql([
        [{ headers: { correlationId: 0, id: 0 } }],
        [{ headers: { correlationId: 1, id: 1 } }],
        [{ headers: { correlationId: 2, id: 2 } }],
        [{ headers: { correlationId: 3, id: 3 } }],
        [{ headers: { correlationId: 4, id: 4 } }]
      ]);
      injectStub.args
        .map(x => x.map(y => y()))
        .should.eql([
          [{ headers: { id: 0 } }],
          [{ headers: { id: 1 } }],
          [{ headers: { id: 2 } }],
          [{ headers: { id: 3 } }],
          [{ headers: { id: 4 } }]
        ]);
    });

    it('should throttle events using different id', async function() {
      const result = Promise.all(
        [...Array(7).keys()].map(i => throttler.process({ headers: { id: i, correlationId: i % 3 } }))
      );
      result.should.containDeepOrdered([undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
      await wait();
      timers.tick(1999);
      await wait();
      resource.args.should.eql([
        [{ headers: { correlationId: 0, id: 0 } }],
        [{ headers: { correlationId: 1, id: 1 } }]
      ]);
      injectStub.args
        .map(x => x.map(y => y()))
        .should.eql([
          [{ headers: { id: 3 } }],
          [{ headers: { id: 6 } }],
          [{ headers: { id: 4 } }],
          [{ headers: { id: 0 } }],
          [{ headers: { id: 1 } }]
        ]);
      timers.tick(1);
      await wait();
      resource.args.should.eql([
        [{ headers: { correlationId: 0, id: 0 } }],
        [{ headers: { correlationId: 1, id: 1 } }],
        [{ headers: { correlationId: 2, id: 2 } }]
      ]);
      injectStub.args
        .map(x => x.map(y => y()))
        .should.eql([
          [{ headers: { id: 3 } }],
          [{ headers: { id: 6 } }],
          [{ headers: { id: 4 } }],
          [{ headers: { id: 0 } }],
          [{ headers: { id: 1 } }],
          [{ headers: { id: 5 } }],
          [{ headers: { id: 2 } }]
        ]);
    });
  });
});
