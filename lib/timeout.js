var amqplib = require('amqplib'),
  broker;

function Timeout(route, delay, cb) {
  this.route = route;
  this.delay = delay;
  this.cb = cb;

  this.queueName = '__' + this.route.name + '_delay';
  this.queueResponseName = '__' + this.route.name + '_response';

  broker.then(function (conn) {
    var ok = conn.createConfirmChannel();
    ok.then(function (channel) {
      this.channel = channel;
      channel.assertQueue(this.queueResponseName);
      channel.assertQueue(this.queueName, {
        messageTtl: this.delay,
        deadLetterExchange: 'amq.direct',
        deadLetterRoutingKey: this.queueResponseName
      });
      channel.bindQueue(this.queueName, 'amq.direct');
      channel.consume(this.queueResponseName, function (msg) {
        if (msg !== null) {
          this.cb(msg.content.toString(), function () {
            channel.ack(msg);
          });
        }
      }.bind(this));
    }.bind(this))
  }.bind(this)).catch(console.error.bind(console));

}

Timeout.connect = function(queue) {
  broker = amqplib.connect(queue, {
    heartbeat: 1
  });
};

Timeout.prototype.inject = function inject(correlationId, cb) {
  if (typeof correlationId !== 'string') {
    correlationId = String(correlationId);
  }
  this.channel.sendToQueue(this.queueName, new Buffer(correlationId), {}, cb);
};

module.exports = Timeout;
