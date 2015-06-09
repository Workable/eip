var eip = require("../index")
  , sinon = require('sinon')
  , sandbox = sinon.sandbox.create({useFakeServer: true, useFakeTimers: false});
require('should');

function wait(delay) {
  return function (cb) {
    setTimeout(cb, delay);
  }
}

describe('Aggregator for simple asynchronous routes:', function () {
  after(function () {
    sandbox.restore();
  });

  describe('toArray events', function () {
    it('should be at the end', function (done) {
      this.events = [];
      var r = new eip.Route().toArray(this.events)
        .process(function (event, cb) {
          event.body.data.should.equal(1);
          this.events.length.should.eql(1);
          this.events[0].should.eql(event);
          done();
        }.bind(this));
      r.inject({data: 1});
      r.shutDown();
    });
  });

  describe('Aggregation MaxNumber strategy', function () {
    it('should aggregate 5 events', function * () {
      this.cb = sandbox.stub();
      var r = new eip.Route().aggregate().process(this.cb)
        , e1 = eip.util.createEvent('First event')
        , e2 = eip.util.createEvent('Second event')
        , e3 = eip.util.createEvent('Third event')
        , e4 = eip.util.createEvent('Fourth event')
        , e5 = eip.util.createEvent('Fifth event')
      e1.headers.id = e2.headers.id = e3.headers.id = e4.headers.id = e5.headers.id = "some id";
      r.inject(e1);
      r.inject(e2);
      r.inject(e3);
      r.inject(e4);
      r.inject(e5);
      r.shutDown();
      yield wait(10);
      this.cb.calledOnce.should.be.true;
      this.cb.args[0][0].body.should.have.length(5);
      this.cb.args[0][0].body[0].should.eql(e1);
      this.cb.args[0][0].body[1].should.eql(e2);
      this.cb.args[0][0].body[2].should.eql(e3);
      this.cb.args[0][0].body[3].should.eql(e4);
      this.cb.args[0][0].body[4].should.eql(e5);
    })
  });

  describe('Aggregation Timeout reached', function () {
    before(function () {
      sandbox = sinon.sandbox.create({useFakeServer: true, useFakeTimers: true});
    });
    it('should timeout after 60 sec', function (done) {
      this.cb = function (event) {
        event.body[0].body.should.equal('First event');
        r.shutDown();
        done();
      };
      var r = new eip.Route().aggregate().process(this.cb)
        , e1 = eip.util.createEvent('First event');
      e1.type = 'setTimeout';
      e1.cb = function () {
        sandbox.clock.tick(60000);
        sandbox.clock.restore();
      }.bind(this);
      r.inject(e1);

    });
  });

});
