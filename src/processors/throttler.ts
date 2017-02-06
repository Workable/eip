import Processor from './processor';

export default class Throttler extends Processor {
  private eventsPerPeriod: number;
  private eventsInProgress: number = 0;
  private periodInMS: number;
  private queue: any[] = [];

  constructor(options) {
    super(options);
    this.eventsPerPeriod = this.input[0];
    this.periodInMS = this.input[1] || 1000;
    this.on('processed', () => {
      if (this.queue.length > 0) {
        var event = this.queue.shift();
        this.addEvent();
        this.inject(() => event);
      }
    });
  }

  async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async addEvent() {
    this.eventsInProgress = this.eventsInProgress + 1;
    await this.wait(this.periodInMS);
    this.eventsInProgress = this.eventsInProgress - 1;
    this.emit('processed');
  }

  async process(event) {
    if (this.eventsInProgress < this.eventsPerPeriod) {
      this.addEvent();
      return event;
    } else {
      this.queue.push(event);
    }
  }
}
