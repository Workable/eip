var amqplib = require('amqplib')
  , log4js = require('log4js')
  , timeout = 30000
  , logger = log4js.getLogger('[aggregator-eip/timeout]');

function Timeout(queue, route, delay, cb) {
  this.queue = queue;
  this.route = route;
  this.delay = delay;
  this.cb = cb;

  this.queueName = '__' + this.route.name + '_delay';
  this.queueResponseName = '__' + this.route.name + '_response';

  this.connect();
}

Timeout.prototype.disconnected = function () {
  logger.error('Timeout queue disconnected.');
  setTimeout(this.connect.bind(this), timeout);
};

Timeout.prototype.connect = function () {
  amqplib.connect(this.queue, {
    heartbeat: 1
  })
    .then(function (conn) {
      this.connection = conn;
      conn.on('close', this.disconnected.bind(this));
      var ok = conn.createConfirmChannel();
      ok.then(function (channel) {
        this.channel = channel;
        channel.on('close', this.disconnected.bind(this));
        channel.assertQueue(this.queueResponseName);
        channel.bindQueue(this.queueResponseName, 'amq.direct', this.queueResponseName);
        channel.assertQueue(this.queueName, {
          messageTtl: this.delay,
          deadLetterExchange: 'amq.direct',
          deadLetterRoutingKey: this.queueResponseName
        });
        channel.consume(this.queueResponseName, function (msg) {
          if (msg !== null) {
            this.cb(msg.content.toString(), function () {
              channel.ack(msg);
            });
          }
        }.bind(this)).catch(console.error.bind(this));
      }.bind(this)).catch(console.error.bind(this))
    }.bind(this)).catch(this.disconnected.bind(this));
};

Timeout.prototype.close = function () {
  return this.connection.close();
};

Timeout.prototype.inject = function inject(correlationId, cb) {
  if (typeof correlationId !== 'string') {
    correlationId = String(correlationId);
  }
  if (!this.channel) {
    logger.warn('waiting to connect to channel');
    return setTimeout(this.inject.bind(this, correlationId, cb), 10);
  }
  this.channel.sendToQueue(this.queueName, new Buffer(correlationId), {}, cb);
};

module.exports = Timeout;
