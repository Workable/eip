import * as EventEmmiter from 'events';

abstract class Queue extends EventEmmiter.EventEmitter {
  abstract async enqueue(id: string, priority: number, event: any);

  abstract async dequeue(): Promise<any[]>;
}

export default Queue;
