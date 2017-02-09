import Route from '../lib/route';
import Mapper from '../lib/processors/mapper';
import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('Route', function () {

  describe('inject', function () {
    let route;
    let mapperStub;

    beforeEach(function () {
      mapperStub = sandbox.stub();
      const mapper = new Mapper({ name: 'testMapper', input: [mapperStub], id: '1' });
      route = new Route(undefined, undefined, [mapper]);
    });

    it('should call 1st processors', function () {
      route.inject('test input');

      mapperStub.calledOnce.should.be.true();
      mapperStub.args.should.eql([
        ['test input']
      ]);
    });

    it('should fail if no processor is added', async function () {
      route = new Route('test-route');
      try {
        await route.inject('test input');
      } catch(e) {
        e.should.eql(new Error('[test-route] No processor is given'));
      }
    })
  });

  describe('register', function () {
    let route;
    let config = { route: { retryLimit: 3, retryDelay: 0 } };

    before(function () {
      Route.register('test', Mapper);
    });

    it('should call processors added', async function () {
      const stub = sandbox.stub().returns('input transformed');
      const stub2 = sandbox.stub();
      route = (<any>new Route('test', config)).test(stub).test(stub2);

      await route.inject('test input');
      stub.calledOnce.should.be.true();
      stub.args.should.eql([
        ['test input']
      ]);

      stub2.calledOnce.should.be.true();
      stub2.args.should.eql([
        ['input transformed']
      ]);
    });

    it('should retry failing processor', async function () {
      const stub = sandbox.stub();
      const stub2 = sandbox.stub();
      stub.onCall(0).returns(Promise.reject('test error'));
      stub.onCall(1).returns(Promise.reject('test error 2'));
      stub.onCall(2).returns(Promise.resolve('input transformed'));
      route = (<any>new Route('test', config)).test(stub).test(stub2);
      await route.inject('test input');

      await new Promise(resolve => setTimeout(resolve, 30));

      stub.calledThrice.should.be.true();
      stub.args.should.eql([
        ['test input'],
        ['test input'],
        ['test input']
      ]);

      stub2.calledOnce.should.be.true();
      stub2.args.should.eql([
        ['input transformed']
      ]);
    });

    it('should retry failing processor and fail', async function () {
      const stub = sandbox.stub();
      const stub2 = sandbox.stub();
      stub.onCall(0).returns(Promise.reject('test error'));
      stub.onCall(1).returns(Promise.reject('test error 2'));
      stub.onCall(2).returns(Promise.reject('test error 3'));
      stub.onCall(3).returns(Promise.reject('test error 4'));
      route = (<any>new Route('test', config)).test(stub).test(stub2);
      await route.inject('test input');

      await new Promise(resolve => setTimeout(resolve, 50));

      stub.callCount.should.equal(4);
      stub.args.should.eql([
        ['test input'],
        ['test input'],
        ['test input'],
        ['test input']
      ]);

      stub2.called.should.be.false();
    });
  });
});
