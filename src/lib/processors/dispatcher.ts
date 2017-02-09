import Processor from './processor';
import Route from '../route';

export default class Dispatcher extends Processor {
  private routes: Route[];

  constructor(options) {
    super(options);
    this.routes = this.input;
  }

  async process(event) {
    await Promise.all(this.routes.map(route => route.inject(event)));
    return event;
  }
}
