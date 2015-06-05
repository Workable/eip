var fixtures = require('mongoose-fixtures'),
  mongoose = require('mongoose'),
  sinon = require('sinon'),
  should = require('should'),
  sandbox = sinon.sandbox.create(),
  AggregationRepository = require('../lib/models/AggregationRepository')
  ;
//connect to mongo
var options = {};
options.server = {socketOptions: { keepAlive: 1 } };
mongoose.connect('mongodb://localhost/aggregation', options);
var db = mongoose.connection;
db.on('error', function (err) {
  Log.error('unable to connect to database', err);
  throw err;
});



describe('Test AggregationRepository Model', function () {

  before(function (done) {
    fixtures.load(__dirname + '/fixtures/', done());
  });
  afterEach(function () {
    sandbox.restore();
  });

  it('should add a new event', function * () {
    var data = yield AggregationRepository.add("192837", "Route3", {name: 'Darth Veider'});
    data.correlationId.should.equal('192837');
    data.events.slice(0,1).pop().name.should.equal('Darth Veider');
  });

  it('should return keys for all entries of Route1', function * () {
    var data = yield AggregationRepository.getKeys("Route1");
    data.length.should.equal(2);
    data[0].correlationId.should.equal('123456');
    data[0].contextId.should.equal('Route1');
    data[0].status.should.equal('initial');
    data[0].events.length.should.equal(2);
    data[1].correlationId.should.equal('456789');
    data[1].contextId.should.equal('Route1');
    data[1].status.should.equal('initial');
    data[1].events.length.should.equal(1);
  });
});

