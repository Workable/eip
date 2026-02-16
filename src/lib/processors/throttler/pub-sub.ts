import * as EventEmmiter from 'events';

abstract class PubSub extends EventEmmiter.EventEmitter {
  static PROCESSED = 'processed';
  static OVERFLOW = 'overflow';
  constructor(public eventsPerPeriod: number) {
    super();
  }

  abstract subscribe(id: string, event: any, subscribe: boolean): Promise<boolean>;

  abstract publish(id: string, result: any);

  abstract timeout();

  inject(id, event, result) {
    this.emit(PubSub.PROCESSED, id, event, result);
  }

  reject(id, event) {
    this.emit(PubSub.OVERFLOW, id, event);
  }
}

export default PubSub;
