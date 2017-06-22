import * as EventEmmiter from 'events';

abstract class PubSub extends EventEmmiter.EventEmitter {
  static PROCESSED = 'processed';
  static OVERFLOW = 'overflow';
  constructor(public eventsPerPeriod: number) {
    super();
  }

  abstract async subscribe(id: string, event: any): Promise<boolean>;

  abstract async publish(id: string, result: any);

  abstract async timeout();

  inject(id, event, result) {
    this.emit(PubSub.PROCESSED, id, event, result);
  }

  reject(id, event) {
    this.emit(PubSub.OVERFLOW, id, event);
  }
}

export default PubSub;
