var Timeout = require("../lib/timeout")
  , sinon = require('sinon')
  , sandbox = sinon.sandbox.create({useFakeServer: true, useFakeTimers: false});
require('should');

if (!global.describe) {
  global.describe = function () {
  };
}
function wait(delay) {
  return function (cb) {
    setTimeout(cb, delay);
  }
}

describe("Timeout", function () {
  beforeEach(function() {
    Timeout.connect("amqp://localhost"); //should be tested with a local rabbitmq
    this.cb = sandbox.stub();
    this.cb.callsArg(1);
    this.timeout = new Timeout({name: 'test'}, 0, this.cb);
  });

  afterEach(function * () {
    this.timeout.close();
    delete this.cb;
    delete this.timeout;
    sandbox.restore();
  });

  it('should timeout', function * () {
    yield this.timeout.inject.bind(this.timeout, 100);
    yield wait(10);
    this.cb.calledOnce.should.be.ok;
    this.cb.args[0][0].should.eql('100');
  });

  it('should timeout twice', function * () {
    yield this.timeout.inject.bind(this.timeout, 100);
    yield this.timeout.inject.bind(this.timeout, 200);
    yield this.timeout.inject.bind(this.timeout, 300);
    yield wait(200);
    console.log(this.cb.callCount);
    //this.cb.calledTwice.should.be.ok;
    this.cb.args[0][0].should.eql('100');
    this.cb.args[1][0].should.eql('200');
    this.cb.args[2][0].should.eql('300');
  })

});
