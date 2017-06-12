import * as EventEmmiter from 'events';

abstract class PubSub extends EventEmmiter.EventEmitter {
  static PROCESSED = 'processed';
  static OVERFLOW = 'overflow';
  constructor(public eventsPerPeriod: number, public periodInMS: number) {
    super();
  }

  abstract async subscribe(id: string, priority: number, event: any): Promise<boolean>;

  abstract async unsubscribe(id: string, result: any);

  inject(id, result) {
    this.emit(PubSub.PROCESSED, id, result);
  }

  reject(id, event) {
    this.emit(PubSub.OVERFLOW, id, event);
  }
}

export default PubSub;
