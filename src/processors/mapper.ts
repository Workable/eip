import Processor from './processor';

export default class Mapper extends Processor {
  private map: (event) => any;

  constructor(options) {
    super(options);
    this.map = this.input[0];
  }

  async process(event) {
      return await this.map(event);
  }
}
