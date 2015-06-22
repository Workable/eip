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
  , AggregationRepository = require('./models/AggregationRepository')
  , Timeout = require('./timeout');

exports.Correlator = Correlator;

//Aggregator
var Aggregator = function () {
};
exports.Aggregator = Aggregator;
util.inherits(Aggregator, eip.Processor);

var AggregationStrategy = function (aggregator) {
  this.aggregator = aggregator;
};

AggregationStrategy.prototype.init = function (aggregator) {
  this.aggregator = aggregator;
};

AggregationStrategy.prototype.inject = function (event) {
  this.emit(event);
};

AggregationStrategy.prototype.emit = function (event) {
  this.aggregator.emitEventByCorrelationId(this.aggregator.options.correlator(event), true)
};

var MaxNumStrategy = function (num) {
  this.num = num
};
util.inherits(MaxNumStrategy, AggregationStrategy);

MaxNumStrategy.prototype.inject = function (event) {
  if (event.body.length > this.num) {
    this.emit(event);
  }
};

exports.AggregationStrategy = AggregationStrategy;

Aggregator.prototype.initTimeout = function (delay) {
  if (this.options.queue) {
    return new Timeout(this.options.queue, this.route, delay, function (msg, ack) {
      this.route.inject({headers: {id: msg}, body: {}, type: 'timeout', cb: ack});
    }.bind(this));
  } else {
    return {
      inject: function (msg, cb) {
        setTimeout(function () {
          this.route.inject({headers: {id: msg}, body: {}, type: 'timeout'});
        }.bind(this), delay);
        cb();
      }.bind(this)
    }
  }
};

/**
 *
 * @param options
 */
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
    this.options.strategy = new MaxNumStrategy(4);
  }
  this.options.strategy.init(this);

  this.timeout = this.initTimeout(this.options.timeoutDelay || 60000);
  eip.Processor.call(this);
};

Aggregator.prototype.getEvent = function * getEvent(correlationId, event) {
  var aggregatedEvent;
  if (this.persist) {
    aggregatedEvent = {
      headers: {id: correlationId},
      body: (yield AggregationRepository.add(correlationId, this.route.name, event)).events
    };
  } else {
    aggregatedEvent = this.aggregatedEvents[correlationId];
    if (!aggregatedEvent) {
      aggregatedEvent = this.aggregatedEvents[correlationId] = eipUtil.createEvent({
        headers: {id: correlationId},
        body: []
      });
    }
    // apply aggregator
    if (!util.isArray(aggregatedEvent.body)) {
      aggregatedEvent.body = [];
    }
    aggregatedEvent.body.push(event);
  }
  return aggregatedEvent;
};

Aggregator.prototype.genData = function * (event) {
  try {
    var correlationId = this.options.correlator(event)
      , aggregatedEvent;

    if (event.type === 'timeout') {
      yield this.timeoutEnd(correlationId);
    }

    aggregatedEvent = yield this.getEvent(correlationId, event);

    if (aggregatedEvent.body.length === 1) {
      yield this.setTimeout(correlationId)
    }
    if (event.type !== 'timeout') { //avoid emitting twice
      this.options.strategy.inject(aggregatedEvent);
    }
    if (event.cb) {
      event.cb();
    }
  } catch (e) {
    Logger.error(e)
  }
};

Aggregator.prototype.setTimeout = function * (correlationId) {
  yield this.timeout.inject.bind(this.timeout, correlationId);
};

Aggregator.prototype.timeoutEnd = function * (correlationId) {
  yield this.genEmitEventByCorrelationId(correlationId)
};

Aggregator.prototype.data = co.wrap(Aggregator.prototype.genData);

Aggregator.prototype.completeOrExpire = function (correlationId, completed) {
  if (completed) {
    return AggregationRepository.complete(correlationId, this.route.name);
  } else {
    return AggregationRepository.expire(correlationId, this.route.name);
  }
};

Aggregator.prototype.genEmitEventByCorrelationId = function * (correlationId, completed) {
  try {
    var e
      , dbRecord;
    if (this.persist) {
      dbRecord = yield AggregationRepository.get(correlationId, this.route.name);
      if (dbRecord.status === 'completed') {
        Logger.info('already completed: ' + correlationId);
        return;
      }
      dbRecord = yield this.completeOrExpire(correlationId, completed);
      e = eipUtil.createEvent({headers: {id: dbRecord.correlationId}, body: dbRecord.events});
    } else {
      e = this.aggregatedEvents[correlationId];
      delete this.aggregatedEvents[correlationId];
    }
    if (e) {
      this.emitEvent(e);
    }
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
