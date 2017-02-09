import Dispatcher from '../../lib/processors/dispatcher';
import * as sinon from 'sinon';

const sandbox = sinon.sandbox.create();

describe('Filter', function () {
  let dispatcher;
  let routes;

  beforeEach(function () {
    routes = [{ inject: sandbox.stub() }, { inject: sandbox.stub() }];
    dispatcher = new Dispatcher({ id: 'id', input: routes, name: 'name', previous: null });
  });

  describe('process', function () {
    it('should call inject event to all routes', async function () {
      const result = await dispatcher.process('event');
      result.should.equal('event');

      routes[0].inject.args.should.eql([
        ['event']
      ]);
      routes[1].inject.args.should.eql([
        ['event']
      ]);
    });

  });
});
