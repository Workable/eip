import * as EventEmmiter from 'events';

abstract class Counter extends EventEmmiter.EventEmitter {
  constructor(public maxNum: number) {
    super();
  }

  abstract async isFull(): Promise<Boolean>;

  abstract async incr(): Promise<Number>;

  abstract async decr(): Promise<Number>;
}
