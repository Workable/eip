import * as EventEmmiter from 'events';

abstract class Queue extends EventEmmiter.EventEmitter {
  abstract enqueue(id: string, priority: number, event: any): void | Promise<void>;

  abstract dequeue(): Promise<any[]>;
}

export default Queue;
