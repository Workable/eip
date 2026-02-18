import Filter from '../../lib/processors/filter';
import * as sinon from 'sinon';
import * as should from 'should';

const sandbox = sinon.createSandbox();

describe('Filter', function () {
  let filter;
  let filterFn;

  beforeEach(function () {
    filterFn = sandbox.stub();
    filter = new Filter({ id: 'id', input: [filterFn], name: 'name', previous: null });
  });

  describe('process', function () {
    it('should call filter and return event', async function () {
      filterFn.returns(true);

      const result = await filter.process('event');
      result.should.equal('event');
      filterFn.args.should.eql([
        ['event']
      ]);
    });

    it('should call filter and return undefined', async function () {
      filterFn.returns(false);

      const result = await filter.process('event');
      should.equal(undefined, result);
      filterFn.args.should.eql([
        ['event']
      ]);
    });
  });
});
