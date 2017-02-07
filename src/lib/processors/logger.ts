import Processor from './processor';
import { getLogger } from '../logger';

export default class Logger extends Processor {
  private cb: (event) => string;

  constructor(options) {
    super(options);
    this.cb = this.input[0] || (x => JSON.stringify(x));
  }

  async process(event) {
    const msg = this.cb(event);
    getLogger()[this.name](`[${this.id}] ${msg}`);
    return event;
  }
}
