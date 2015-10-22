var amqplib = require('amqplib')
  , timeout = process.env.AGGREGATOR_TIMEOUT_DELAY || 30000
  , prefetch = process.env.TIMEOUT_PREFETCH || 10
  , config = require('./eip').config;

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
  config.logger.error('Timeout queue could not connect. Retrying ...');
  this.channel = null;
  this.connection = null;
  setTimeout(this.connect.bind(this), timeout);
};

Timeout.prototype.connect = function () {
  amqplib.connect(this.queue, {
    heartbeat: 1
  })
    .then(function (conn) {
      config.logger.info('Timeout queue connected.');
      this.connection = conn;
      this.connection.on('close', config.logger.error.bind(config.logger, 'Connection to rabbitmq closed...'));
      this.connection.on('error', config.logger.error.bind(config.logger, 'Connection error with rabbitmq: '));
      var ok = conn.createConfirmChannel();
      ok.then(function (channel) {
        this.channel = channel;
        this.channel.on('close', this.disconnected.bind(this));
        this.channel.prefetch(prefetch);
        channel.assertQueue(this.queueResponseName, {durable: true});
        channel.bindQueue(this.queueResponseName, 'amq.direct', this.queueResponseName);
        channel.assertQueue(this.queueName, {
          //messageTtl: this.delay,
          deadLetterExchange: 'amq.direct',
          deadLetterRoutingKey: this.queueResponseName,
          durable: true
        });

        channel.consume(this.queueResponseName, function (msg) {
          if (msg !== null) {
            this.cb(msg.content.toString(), function () {
              channel.ack(msg);
            });
          }
        }.bind(this));

      }.bind(this))
        .catch(config.logger.error.bind(config.logger))

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
    config.logger.warn('waiting to connect to channel');
    return setTimeout(this.inject.bind(this, correlationId, cb), timeout);
  }
  this.channel.sendToQueue(this.queueName, new Buffer(correlationId), {persistent: true, expiration: this.delay}, cb);
};

module.exports = Timeout;
