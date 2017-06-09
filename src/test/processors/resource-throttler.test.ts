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

  before(function() {
    init();
  });

  beforeEach(function() {
    resource = sandbox.stub().returns({});
    throttler = new Throttler({ id: 'id', input: [2, 2000, resource], name: 'name', previous: null });
    timers = sinon.useFakeTimers();
    injectStub = sandbox.stub(throttler, 'inject');
    infoStub = sandbox.stub(getLogger(), 'info');
  });

  afterEach(function() {
    sandbox.restore();
    timers.restore();
  });

  describe.only('process', function() {
    it('should throttle events', async function() {
      const result = Promise.all([...Array(5).keys()].map(i => throttler.process({ headers: { id: i } })));
      result.should.containDeepOrdered([undefined, undefined, undefined, undefined, undefined]);
      await wait();
      timers.tick(1999);
      await wait();
      resource.args.should.eql([[{ headers: { id: 0 } }], [{ headers: { id: 1 } }]]);
      injectStub.args.map(x => x.map(y => y())).should.eql([[{}], [{}]]);
      timers.tick(1);
      await wait();
      resource.args.should.eql([
        [{ headers: { id: 0 } }],
        [{ headers: { id: 1 } }],
        [{ headers: { id: 2 } }],
        [{ headers: { id: 3 } }]
      ]);
      injectStub.args.map(x => x.map(y => y())).should.eql([[{}], [{}], [{}], [{}]]);
      timers.tick(2000);
      await wait();
      resource.args.should.eql([
        [{ headers: { id: 0 } }],
        [{ headers: { id: 1 } }],
        [{ headers: { id: 2 } }],
        [{ headers: { id: 3 } }],
        [{ headers: { id: 4 } }]
      ]);
      injectStub.args.map(x => x.map(y => y())).should.eql([[{}], [{}], [{}], [{}], [{}]]);
    });

    it('should throttle events using different id', async function() {
      const result = Promise.all([...Array(5).keys()].map(i => throttler.process({ headers: { id: i % 3 } })));
      result.should.containDeepOrdered([undefined, undefined, undefined, undefined, undefined]);
      await wait();
      timers.tick(1999);
      await wait();
      resource.args.should.eql([[{ headers: { id: 0 } }], [{ headers: { id: 1 } }]]);
      injectStub.args.map(x => x.map(y => y())).should.eql([[{}], [{}], [{}], [{}]]);
      timers.tick(1);
      await wait();
      resource.args.should.eql([[{ headers: { id: 0 } }], [{ headers: { id: 1 } }], [{ headers: { id: 2 } }]]);
      injectStub.args.map(x => x.map(y => y())).should.eql([[{}], [{}], [{}], [{}], [{}]]);
    });
  });
});
