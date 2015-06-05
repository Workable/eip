var util = require('util')
  , eip = require('./eip')
  , eipUtil = require('./util').Util
  , mongoose = require('mongoose')
  , co = require('co')
  , Correlator = {
    correlationId: function (event) {
      return event.headers.correlationId || event.headers.id;
    }
  }
  , db
  , log4js = require('log4js')
  , Logger = log4js.getLogger('[aggregator]')
  , AggregationRepository = require('./models/AggregationRepository');

exports.Correlator = Correlator;

//Aggregator
var Aggregator = function () {
};
exports.Aggregator = Aggregator;
util.inherits(Aggregator, eip.Processor);

var MaxNumStrategy = function (aggregator, num) {
  this.aggregator = aggregator;
  this.num = num;
};

MaxNumStrategy.prototype.inject = function (event) {
  if (event.body.length > this.num) {
    this.aggregator.emitEventByCorrelationId(this.aggregator.options.correlator(event))
  }
};

exports.MaxNumstrategy = MaxNumStrategy;

Aggregator.prototype.init = function (options) {
  this.options = options || {};
  if (!this.options.correlator) {
    this.options.correlator = Correlator.correlationId;
  }

  if (this.options.db) {
    this.persist = true;
    Aggregator.initDB(this.options)
  } else {
    this.persist = false;
    this.aggregatedEvents = {};
  }

  if (!this.options.strategy) {
    this.options.strategy = new MaxNumStrategy(this, 4);
  }

  eip.Processor.call(this);
};

Aggregator.prototype.genData = function * (event) {
  try {
    var correlationId = this.options.correlator(event)
      , aggregatedEvent;

    if (this.persist) {
      aggregatedEvent = {
        headers: {id: correlationId},
        body: (yield AggregationRepository.add(correlationId, this.route.name, event)).events
      };
    } else {
      aggregatedEvent = this.aggregatedEvents[correlationId];
      if (!aggregatedEvent) {
        aggregatedEvent = this.aggregatedEvents[correlationId] = eipUtil.createExvent();
        // apply aggregator
        if (!util.isArray(aggregatedEvent.body)) {
          aggregatedEvent.body = [];
        }
        aggregatedEvent.body.push(event);
      }
    }

    this.options.strategy.inject(aggregatedEvent);

    if (event.cb) {
      event.cb();
    }
  } catch (e) {
    Logger.error(e)
  }
};

Aggregator.prototype.data = co.wrap(Aggregator.prototype.genData);

Aggregator.prototype.genEmitEventByCorrelationId = function * (correlationId) {
  try {
    var e
      , dbRecord;
    if (this.persist) {
      dbRecord = yield AggregationRepository.expire(correlationId, this.route.name);
      if(dbRecord.status === 'expired') {
        return;
      }
      e = eipUtil.createEvent(dbRecord.events);
    } else {
      e = this.aggregatedEvents[correlationId];
      delete this.aggregatedEvents[correlationId];
    }
    this.emitEvent(e);
  } catch (e) {
    Logger.error(e);
  }
};

Aggregator.prototype.emitEventByCorrelationId = co.wrap(Aggregator.prototype.genEmitEventByCorrelationId);

Aggregator.prototype.emitAll = function () {
  var c;
  for (c in this.aggregatedEvents) {
    this.emitEventByCorrelationId(c);
  }
};

Aggregator.prototype.shutDown = function () {
  console.log("Shutting down aggregator...");
};

Aggregator.initDB = function (options) {
  options.server = {socketOptions: {keepAlive: 1}};
  if (mongoose.connection.db) {
    return;
  }

  mongoose.connect(options.db, options.server);
  db = mongoose.connection;
  db.on('error', function (err) {
    Logger.error('unable to connect to database', err);
    throw err;
  });
}
