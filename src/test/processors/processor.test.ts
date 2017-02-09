import Processsor from '../../lib/processors/processor';
import * as sinon from 'sinon';
const sandbox = sinon.sandbox.create();

describe('Processor', function () {
  class TestProcessor extends Processsor {
    getInternals() {
      return {
        name: this.name,
        input: this.input,
        id: this.id,
        previous: this.previous
      };
    }

    async process(event) {
      return event;
    }
  }

  afterEach(function () {
    sandbox.restore();
  })

  describe('constructor', function () {
    it('should set state according to input', function () {
      const previous = { on: sandbox.stub() };

      const safeProcessStub = sandbox.stub(TestProcessor.prototype, 'safeProcess');

      const test = new TestProcessor({ id: 'id', input: 'input', name: 'name', previous });
      test.getInternals().should.eql({
        id: 'id',
        input: 'input',
        name: 'name',
        previous
      });

      previous.on.calledOnce.should.be.true();
      previous.on.args.should.containDeep([
        ['event']
      ]);

      previous.on.args[0][1]('event');
      safeProcessStub.calledOnce.should.be.true();
      safeProcessStub.args.should.eql([
        ['event']
      ]);
    });

    it('should set state with null previous', function () {
      const previous = null;
      const test = new TestProcessor({ id: 'id', input: 'input', name: 'name', previous });
      test.getInternals().should.eql({
        id: 'id',
        input: 'input',
        name: 'name',
        previous
      });
    });
  });

  describe('safeProcess', function () {
    it('should call inject with this.process as cb', function () {
      const test = new TestProcessor({ id: 'id', input: 'input', name: 'name', previous: null });

      const injectStub = sandbox.stub(test, 'inject');
      const processStub = sandbox.stub(test, 'process');

      test.safeProcess('event');

      injectStub.calledOnce.should.be.true();
      injectStub.args[0][0]();
      processStub.calledOnce.should.be.true();
      processStub.args.should.eql([
        ['event']
      ]);
    });
  });

  describe('inject', function () {
    let test;
    let cbStub;
    let emitStub;

    beforeEach(function () {
      test = new TestProcessor({ id: 'id', input: 'input', name: 'name', previous: null });
      cbStub = sandbox.stub();
      emitStub = sandbox.stub(test, 'emit');
    });

    it('should run cb', function () {
      test.inject(cbStub);

      cbStub.calledOnce.should.be.true();
      cbStub.args.should.eql([[]]);
      emitStub.called.should.be.false();
    });

    it('should run cb and emit result', async function () {
      cbStub.returns('data');
      await test.inject(cbStub);

      cbStub.calledOnce.should.be.true();
      cbStub.args.should.eql([[]]);

      emitStub.calledOnce.should.be.true();
      emitStub.args.should.eql([
        ['event', 'data']
      ]);
    });

    it('should run cb and emit error', async function () {
      cbStub.throws(new Error('test'));
      await test.inject(cbStub);

      cbStub.calledOnce.should.be.true();
      cbStub.args.should.eql([[]]);

      emitStub.calledOnce.should.be.true();
      emitStub.args.should.containDeep([
        ['error', new Error('test')]
      ]);

      const injectStub = sandbox.stub(test, 'inject');

      emitStub.args[0][2]();
      injectStub.calledOnce.should.be.true()
      injectStub.args.should.eql([
        [cbStub, false]
      ]);
    });

    it('should run cb and throw error', async function () {
      cbStub.throws(new Error('test'));
      try {
        await test.inject(cbStub, false);
        true.should.be.false();
      } catch (e) {
        cbStub.calledOnce.should.be.true();
        cbStub.args.should.eql([[]]);
        e.should.eql(new Error('test'));
      }
    });
  });
});
