var fixtures = require('mongoose-fixtures'),
  should = require('should'),
  sinon = require('sinon'),
  sandbox = sinon.sandbox.create(),
  AggregationRepository = require('../../lib/models/AggregatorRepository')
  ;


describe('Test AggregationRepository Model', function () {

  before(function (done) {
    fixtures.load(__dirname + '/../fixtures', done);
  });
  afterEach(function () {
    sandbox.restore();
  });

  it('should add a new event', function (done) {
    AggregationRepository.add("abc", {name: 'Darth Veider'}, function (err, savedModel) {
      should(err).be.null;
      savedModel.correlationId.should.equal('abc');
      savedModel.events.pop().name.should.equal('Darth Veider');
      done();
    });
  });
});

function stubAggregationRepository(method) {
  return sandbox.stub(AggregationRepository, method, function () {
    return {
      exec: function (func) {
        func("Stub error " + method);
      }
    };
  });
}
