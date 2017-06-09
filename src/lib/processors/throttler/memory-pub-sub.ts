import * as EventEmmiter from 'events';
import PubSub from './pub-sub';

export default class MemoryPubSub extends PubSub {
  private events: Map<String, any> = new Map();
  private queue: any[] = [];

  async subscribe(id: string, event, cb, cb2): Promise<boolean> {
    if (this.events.has(id)) {
      this.events.get(id).on(PubSub.PROCESSED, cb);
      return true;
    }

    if (this.events.size < this.eventsPerPeriod) {
      this.events.set(id, new EventEmmiter.EventEmitter());
      setTimeout(cb2, this.periodInMS);
      return false;
    } else {
      this.queue.push({ id, event });
      return true;
    }
  }

  async unsubscribe(id: string, result) {
    this.events.get(id).emit(PubSub.PROCESSED, result);
    this.events.delete(id);
  }

  async getQueue() {
    if (this.queue.length > 0) {
      const { id, event } = this.queue.shift();
      const similarEvents = this.queue.filter(e => id === e.id).map(({ event }) => event);
      this.queue = this.queue.filter(e => id !== e.id);
      return [event, ...similarEvents];
    }
  }
}
