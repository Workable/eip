import * as EventEmmiter from 'events';

abstract class Processor extends EventEmmiter.EventEmitter {
  protected name: string;
  protected id: string;
  protected input: any[];
  protected previous: Processor;

  constructor({name, input, id, previous}) {
    super();
    this.name = name;
    this.input = input;
    this.id = id;
    this.previous = previous;

    if (this.previous) {
      this.previous.on('event', (event) => this.addEvent(event));
    }
  }

  async addEvent(event) {
    try {
      const result = await this.process(event);
      if (result) {
        this.emit('event', result);
      }
    } catch (e) {
      this.emit('error', e);
    }
  }

  async abstract process(event: any);
}

export default Processor;
