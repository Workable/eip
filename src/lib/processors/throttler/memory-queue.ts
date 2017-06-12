import Queue from './queue';

export default class MemoryQueue extends Queue {
  private queue: any[] = [];

  async enqueue(id: string, priority: number, event: any) {
    this.queue.push({ id, priority, event });
  }

  async dequeue() {
    if (this.queue.length > 0) {
      const { id, event } = this.queue.sort((a, b) => b.priority - a.priority).shift();
      const similarEvents = this.queue.filter(e => id === e.id).map(({ event }) => event);
      this.queue = this.queue.filter(e => id !== e.id);
      return [event, ...similarEvents];
    }
  }
}
