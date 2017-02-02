import * as EventEmmiter from 'events';

abstract class AggregationStrategy extends EventEmmiter.EventEmitter {
  abstract async check(event);

  inject(event, status) {
    this.emit('event', event, status);
  }
}

export default AggregationStrategy;
