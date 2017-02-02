import Processor from './processor';

export default class Filter extends Processor {
  private condition: (event) => any;

  constructor(options) {
    super(options);
    this.condition = this.input[0];
  }

  async process(event) {
    const condition = await this.condition(event);
    if (condition) {
      return event;
    }
  }
}
