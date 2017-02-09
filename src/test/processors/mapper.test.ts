import Mapper from '../../lib/processors/mapper';
import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('Mapper', function () {
  let mapper;
  let mapFn;

  beforeEach(function () {
    mapFn = sandbox.stub();
    mapper = new Mapper({ id: 'id', input: [mapFn], name: 'name', previous: null });
  });

  describe('process', function () {
    it('should call map and return result', async function () {
      mapFn.returns('transformed');

      const result = await mapper.process('event');
      result.should.be.eql('transformed');

      mapFn.args.should.eql([
        ['event']
      ]);
    });
  });
});
