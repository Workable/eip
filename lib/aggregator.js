var util = require('util')
  , eip = require('./eip')
  , eipUtil = require('./util').Util
  , mongoose = require('mongoose')
  , Correlator = {
    correlationId: function (event) {
      return event.headers.correlationId || event.headers.id;
    }
  }
  , db;

exports.Correlator = Correlator;


//Aggregator
var Aggregator = function () {
};
exports.Aggregator = Aggregator;
util.inherits(Aggregator, eip.Processor);

Aggregator.prototype.init = function (options) {
  this.options = options || {};
  if (!this.options.correlator) {
    this.options.correlator = Correlator.correlationId;
  }

  eip.Processor.call(this);
};

Aggregator.prototype.data = function (event) {
  var correlationId = this.options.correlator(event)
    , aggregatedEvent = this.aggregatedEvents[correlationId];
  if (!aggregatedEvent) {
    aggregatedEvent = this.aggregatedEvents[correlationId] = eipUtil.createExvent();
  }

  // apply aggregator
  if (this.options.aggregator) {
    this.options.aggregator.apply(this, [ aggregatedEvent, event ]);
  } else {
    if (!util.isArray(aggregatedEvent.body)) {
      aggregatedEvent.body = [];
    }
    aggregatedEvent.body.push(event);
  }

};

Aggregator.prototype.emitEventByCorrelationId = function (correlationId) {
  var e = this.aggregatedEvents[correlationId];
  delete this.aggregatedEvents[correlationId];
  this.emitEvent(e);
};

Aggregator.prototype.emitAll = function () {
  var c;
  for (c in this.aggregatedEvents) {
    this.emitEventByCorrelationId(c);
  }
};

Aggregator.prototype.shutDown = function () {
  console.log("Shutting down aggregator...");
};

Aggregator.initDB = function(options){
  options.server = {socketOptions: { keepAlive: 1 } };
  mongoose.connect(options.db, options.server);
  db = mongoose.connection;
  db.on('error', function (err) {
    Logger.error('unable to connect to database', err);
    throw err;
  });
}
