var amqplib = require('amqplib')
  , log4js = require('log4js')
  , timeout = process.env.AGGREGATOR_TIMEOUT_DELAY || 30000
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
  logger.error('Timeout queue could not connect. Retrying ...');
  this.channel = null;
  this.connection = null;
  setTimeout(this.connect.bind(this), timeout);
};

Timeout.prototype.connect = function () {
  amqplib.connect(this.queue, {
    heartbeat: 1
  })
    .then(function (conn) {
      logger.info('Timeout queue connected.');
      this.connection = conn;
      this.connection.on('close', logger.error.bind(logger, 'Connection to rabbitmq closed %s'));
      var ok = conn.createConfirmChannel();
      ok.then(function (channel) {
        this.channel = channel;
        this.channel.on('close', this.disconnected().bind(this));
        this.channel.on('error', logger.error.bind(logger, 'Channel to rabbitmq closed %s'));
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
        }.bind(this));

      }.bind(this))
        .catch(console.error.bind(this))

    }.bind(this))
    .catch(this.disconnected.bind(this));
};

Timeout.prototype.close = function () {
  this.connection.close();
  this.channel = null;
  this.connection = null;
  return;
};

Timeout.prototype.inject = function inject(correlationId, cb) {
  if (typeof correlationId !== 'string') {
    correlationId = String(correlationId);
  }
  if (!this.channel) {
    logger.warn('waiting to connect to channel');
    return setTimeout(this.inject.bind(this, correlationId, cb), timeout);
  }
  this.channel.sendToQueue(this.queueName, new Buffer(correlationId), {}, cb);
};

module.exports = Timeout;
