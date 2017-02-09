
import * as logger from '../lib/logger';
import * as log4js from 'log4js';

describe('Logger', function () {
  it('should inialize logger with name aggregator-eip', function () {
    logger.init(null);
    logger.getLogger().should.eql(log4js.getLogger('[aggregator-eip]'));
  });

  it('should initialize logger with given one', function () {
    const log = log4js.getLogger('test');
    logger.init(log);
    logger.getLogger().should.eql(log);
  });

});
