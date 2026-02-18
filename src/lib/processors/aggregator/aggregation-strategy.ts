import * as EventEmmiter from 'events';
import Store from './store';

abstract class AggregationStrategy extends EventEmmiter.EventEmitter {
  abstract process(event): void | Promise<void>;

  inject(event, status = Store.STATUS.COMPLETED) {
    this.emit('event', event, status);
  }
}

export default AggregationStrategy;
