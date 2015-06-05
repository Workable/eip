var mongoose = require('mongoose')
  , server = {socketOptions: {keepAlive: 1}}
  , repl = require("repl")




  global.eip = require('./lib/eip');
  global.aggregator = require('./lib/aggregator');


//mongoose.connect('mongodb://localhost/aggregation', server);


mongoose.Query.prototype.async = function () {
  var result = {};
  if (typeof this.exec === 'function') {
    this.exec(function (error, data) {
      if (error) {
        throw error;
      } else {
        result.data = data;
      }
    });

  }
  return result;
};
Promise.prototype.async = function () {
  var result = {};
  this.then(function (data) {
    result.data = data;
  }, function (error) {
    result.error = error.stack;
  });
  return result;
};


var replStarted = repl.start({
  prompt: 'aggregator-eip> ', input: process.stdin,
  output: process.stdout
});

require('repl.history')(replStarted, process.env.HOME + '/.node_history');



