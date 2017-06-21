import * as EventEmmiter from 'events';
import PubSub from './pub-sub';

export default class MemoryPubSub extends PubSub {
  private events: Map<String, any> = new Map();
  private counter = 0;

  async subscribe(id: string, event): Promise<boolean> {
    if (this.events.has(id)) {
      this.events.get(id).on(PubSub.PROCESSED, result => this.inject(id, event, result));
      return true;
    }

    if (this.counter < this.eventsPerPeriod) {
      this.counter++;
      this.events.set(id, new EventEmmiter.EventEmitter());
      return false;
    } else {
      this.reject(id, event);
      return true;
    }
  }

  async timeout() {
    this.counter--;
  }

  async unsubscribe(id: string, result) {
    this.events.get(id).emit(PubSub.PROCESSED, result);
    this.events.delete(id);
  }
}
