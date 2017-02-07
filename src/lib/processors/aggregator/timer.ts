import * as EventEmmiter from 'events';

abstract class Timer extends EventEmmiter.EventEmitter {
  constructor(public delays) {
    super();
  }

  abstract start(id: string);

  inject(id, attempt) {
    this.emit('event', id, attempt);
  }
}

export default Timer;
