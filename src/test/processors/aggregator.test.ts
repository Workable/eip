import Aggregator from '../../lib/processors/aggregator';
import { init, getLogger } from '../../lib/logger';
import * as MemoryTimer from '../../lib/processors/aggregator/memory-timer';
import * as MaxNumStrategy from '../../lib/processors/aggregator/max-num-strategy';

import * as sinon from 'sinon';
import * as should from 'should';
const sandbox = sinon.createSandbox();

describe('Aggregator', function () {

  before(function () {
    init();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('constructor', function () {
    it('should use defaults and not throw error', function () {
      new Aggregator({ input: [] });
    });

    it('should use maxTimes and timeout', function () {
      const timerStub = sandbox.stub(MemoryTimer, 'default').returns({ on: sandbox.stub() });
      const strategyStub = sandbox.stub(MaxNumStrategy, 'default').returns({ on: sandbox.stub() });
      new Aggregator({ input: [{ maxTimes: 100, timeout: [1, 2, 3] }] });

      timerStub.args.should.eql([
        [[1, 2, 3]]
      ]);
      strategyStub.args.should.eql([
        [100]
      ]);
    });

    it('should listen for timer and strategy events', function () {
      const strategy = { on: sandbox.stub() };
      const timer = { on: sandbox.stub() };

      new Aggregator({ input: [{ strategy, timer }] });

      strategy.on.calledOnce.should.be.true();
      strategy.on.args.should.containDeep([
        ['event']
      ]);

      timer.on.calledOnce.should.be.true();
      timer.on.args.should.containDeep([
        ['event']
      ]);
    });

    it('should call inject and aggregate on strategy event', function () {
      const strategy = { on: sandbox.stub() };

      const aggregator = new Aggregator({ input: [{ strategy }] });
      const injectStub = sandbox.stub(aggregator, 'inject');
      const aggregateStub = sandbox.stub(aggregator, 'aggregate');

      const event = { headers: { id: 1 }, body: 'body' };
      strategy.on.args[0][1](event, 'COMPLETED');
      injectStub.calledOnce.should.be.true();
      injectStub.args[0][0]();
      aggregateStub.calledOnce.should.be.true();
      event.headers.id = 3; // test cloneHeaders
      aggregateStub.args.should.eql([
        [{ headers: { id: 1 }, body: 'body' }, 'COMPLETED']
      ]);
    });

    it('should call inject and aggregate on timer event', async function () {
      const timer = { on: sandbox.stub() };
      const event = { headers: { id: 1 }, body: 'body' };
      const debugStub = sandbox.stub(getLogger(), 'debug');

      const store = { getById: sandbox.stub().returns(event) };

      const aggregator = new Aggregator({ input: [{ timer, store }] });
      const injectStub = sandbox.stub(aggregator, 'inject');
      const aggregateStub = sandbox.stub(aggregator, 'aggregate');

      await timer.on.args[0][1](1, 2, 10);

      store.getById.args.should.eql([
        [1]
      ]);

      injectStub.calledOnce.should.be.true();
      injectStub.args[0][0]();
      aggregateStub.calledOnce.should.be.true();
      event.headers.id = 3; // test cloneHeaders
      aggregateStub.args.should.eql([
        [{ headers: { id: 1 }, body: 'body' }, 'TIMEOUT']
      ]);
      debugStub.args.should.eql([
        ['[undefined] [timeout-2] [1] after 10 ms']
      ]);
    });

     it('should call inject and aggregate on timer event with status COMPLETED', async function () {
      const timer = { on: sandbox.stub() };
      const event = { headers: { id: 1 }, body: 'body' };
      const debugStub = sandbox.stub(getLogger(), 'debug');

      const store = { getById: sandbox.stub().returns(event) };

      const aggregator = new Aggregator({ input: [{ timer, store, completeOnTimeout: true }] });
      const injectStub = sandbox.stub(aggregator, 'inject');
      const aggregateStub = sandbox.stub(aggregator, 'aggregate');

      await timer.on.args[0][1](1, 2, 10);

      store.getById.args.should.eql([
        [1]
      ]);

      injectStub.calledOnce.should.be.true();
      injectStub.args[0][0]();
      aggregateStub.calledOnce.should.be.true();
      event.headers.id = 3; // test cloneHeaders
      aggregateStub.args.should.eql([
        [{ headers: { id: 1 }, body: 'body' }, 'COMPLETED']
      ]);
      debugStub.args.should.eql([
        ['[undefined] [timeout-2] [1] after 10 ms']
      ]);
    });

    context('when timeouts but is already completed', function () {
      it('should call inject and aggregate on timer event and log error', async function () {
        const timer = { on: sandbox.stub() };
        const debugStub = sandbox.stub(getLogger(), 'debug');

        const store = { getById: sandbox.stub().returns(undefined) };

        new Aggregator({ input: [{ timer, store }] });

        await timer.on.args[0][1](1, 2, 10);

        debugStub.args.should.eql([
          ['[undefined] [timeout-2] [1] Already completed']
        ]);
      });
    });
  });

  describe('process', function () {
    it('should start timer and process strategy', async function () {
      const strategy = { on: sandbox.stub(), process: sandbox.stub() };
      const timer = { on: sandbox.stub(), start: sandbox.stub() };
      const event = { headers: { id: 1 }, body: 'body' };
      const aggrEvent = { headers: { id: 1 }, body: ['body'] };
      const store = { append: sandbox.stub().returns(aggrEvent) };

      const aggregator = new Aggregator({ input: [{ strategy, timer, store }] });
      await aggregator.process(event);

      timer.start.args.should.eql([
        [1]
      ]);
      strategy.process.args.should.eql([
        [aggrEvent]
      ]);
    });

    it('should process strategy', async function () {
      const strategy = { on: sandbox.stub(), process: sandbox.stub() };
      const timer = { on: sandbox.stub(), start: sandbox.stub() };
      const event = { headers: { id: 1 }, body: 'body' };
      const aggrEvent = { headers: { id: 1 }, body: ['body', 'body2'] };
      const store = { append: sandbox.stub().returns(aggrEvent) };

      const aggregator = new Aggregator({ input: [{ strategy, timer, store }] });
      await aggregator.process(event);

      timer.start.called.should.be.false();
      strategy.process.args.should.eql([
        [aggrEvent]
      ]);
    });
  });

  describe('aggregate', function () {
    it('should set status and return updated event', async function () {
      const aggrEvent = { headers: { id: 1, status: 'COMPLETED', aggregationNum: 1, timeoutNum: 2 }, body: ['body'] };
      const debugStub = sandbox.stub(getLogger(), 'debug');
      const store = { setStatus: sandbox.stub().returns(aggrEvent) };
      const aggregator = new Aggregator({ input: [{ store }] });

      const result = await aggregator.aggregate({ headers: { status: 'TIMEOUT' } }, 'COMPLETED');
      result.should.eql({
        headers: {
          id: 1,
          status: 'COMPLETED',
          previousStatus: 'TIMEOUT',
          aggregationNum: 1,
          timeoutNum: 2
        }, body: ['body']
      });
      debugStub.args.should.eql([
        ['[undefined] [1] [aggregation-1] [timeout-2] Aggregating event with status COMPLETED']
      ]);
    });

    it('should return undefined if set status returns undefined', async function () {
      const store = { setStatus: sandbox.stub().returns(undefined) };
      const aggregator = new Aggregator({ input: [{ store }] });
      const errorStub = sandbox.stub(getLogger(), 'error');
      const debugStub = sandbox.stub(getLogger(), 'debug');

      const result = await aggregator.aggregate({ headers: { status: 'TIMEOUT' } }, 'TIMEOUT');

      should.equal(undefined, result);
      errorStub.called.should.be.false();
      debugStub.args.should.eql([
        [`[undefined] [timeout] [undefined] Already completed`]
      ]);
    });

    it('should return undefined and log error if set status returns undefined and new status is not timeout', async function () {
      const store = { setStatus: sandbox.stub().returns(undefined) };
      const aggregator = new Aggregator({ input: [{ store }] });
      const errorStub = sandbox.stub(getLogger(), 'error');

      const result = await aggregator.aggregate({ headers: { id: '1', status: 'TIMEOUT' } }, 'COMPLETED');

      should.equal(undefined, result);
      errorStub.args.should.eql([
        [`[undefined] [1] Could not set status to COMPLETED. Probably already completed {"headers":{"id":"1","status":"TIMEOUT"}}`]
      ]);
    });
  });
});
