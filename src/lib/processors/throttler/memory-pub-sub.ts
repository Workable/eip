import * as EventEmmiter from 'events';
import PubSub from './pub-sub';

export default class MemoryPubSub extends PubSub {
  private events: Map<String, any> = new Map();

  async subscribe(id: string, priority: number, event): Promise<boolean> {
    if (this.events.has(id)) {
      this.events.get(id).on(PubSub.PROCESSED, result => this.inject(id, result));
      return true;
    }

    if (this.events.size < this.eventsPerPeriod) {
      this.events.set(id, new EventEmmiter.EventEmitter());
      return false;
    } else {
      this.reject(id, event);
      return true;
    }
  }

  async unsubscribe(id: string, result) {
    this.events.get(id).emit(PubSub.PROCESSED, result);
    this.events.delete(id);
  }
}
