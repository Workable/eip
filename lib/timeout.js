var broker = require('amqplib').connect('amqp://localhost')
  , channel;

function Timeout(route, delay) {
  this.route = route;
  this.delay = delay;

  this.queueName = '__' + this.route.name;
  this.queueResponseName = '__' + this.route.name + '_response';

  broker.then(function(conn) {
    var ok = conn.createConfirmChannel();
    ok.then(function(channel) {
      this.channel = channel;
      channel.assertQueue(this.queueName);
      channel.assertQueue(this.queueResponseName);
    }.bind(this))
  }.bind(this));

}

Timeout.prototype.inject = function inject(event) {

};



module.exports = Timeout;
