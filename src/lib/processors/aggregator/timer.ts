import * as EventEmmiter from 'events';

abstract class Timer extends EventEmmiter.EventEmitter {
  constructor(public delays: number[]) {
    super();
  }

  abstract start(id: string);

  inject(id, attempt, delay) {
    this.emit('event', id, attempt, delay);
  }
}

export default Timer;
