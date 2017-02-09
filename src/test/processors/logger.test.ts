import Logger from '../../lib/processors/logger';
import * as sinon from 'sinon';
import * as should from 'should';
import { getLogger } from '../../lib/logger';

const sandbox = sinon.sandbox.create();

describe('Logger', function () {
  let logger;
  let cbFn;
  let loggerStub;

  beforeEach(function () {
    cbFn = sandbox.stub();
    logger = new Logger({ id: 'id', input: [cbFn], name: 'info', previous: null });
    loggerStub = sandbox.stub(getLogger(), 'info');
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('process', function () {
    it('should call logger and return event', async function () {
      cbFn.returns('text');

      const result = await logger.process('event');
      result.should.equal('event');
      cbFn.args.should.eql([
        ['event']
      ]);
      loggerStub.calledOnce.should.be.true();
      loggerStub.args.should.eql([
        ['[id] text']
      ]);
    });

    it('should call logger and return event using default cb and warn', async function () {
      logger = new Logger({ id: 'id', input: [], name: 'warn', previous: null });
      loggerStub = sandbox.stub(getLogger(), 'warn');

      const result = await logger.process('event');
      result.should.equal('event');
      loggerStub.calledOnce.should.be.true();
      loggerStub.args.should.eql([
        ['[id] "event"']
      ]);
    });
  });
});
