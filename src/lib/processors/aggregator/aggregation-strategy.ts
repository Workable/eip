import * as EventEmmiter from 'events';
import Store from './store';

abstract class AggregationStrategy extends EventEmmiter.EventEmitter {
  abstract async check(event);

  inject(event, status = Store.STATUS.COMPLETED) {
    this.emit('event', event, status);
  }
}

export default AggregationStrategy;
