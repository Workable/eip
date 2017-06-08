import Processor from './processor';
import * as EventEmmiter from 'events';
import { getLogger } from '../logger';

export default class ResourceThrottler extends Processor {
  private eventsPerPeriod: number;
  private eventsInProgress: number = 0;
  private periodInMS: number;
  private resource: Function;
  private queue: any[] = [];
  private currentEvents: Map<String, any> = new Map();

  constructor(options) {
    super(options);
    this.eventsPerPeriod = this.input[0];
    this.periodInMS = this.input[1] || 1000;
    this.resource = this.input[2] || (x => x);
    this.on('processed', () => this.processQueue());
  }

  processQueue() {
    if (this.queue.length > 0) {
      const event = this.queue.shift();
      this.addEvent(event);
      const similarEvents = this.queue.filter(e => this.getId(e) === this.getId(event));
      this.queue = this.queue.filter(e => this.getId(e) !== this.getId(event));
      similarEvents.forEach(e => this.addEvent(e));
    }
  }

  getId(event) {
    return event.headers.id;
  }

  getPriority(event) {
    return event.headers.priority;
  }

  async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run(event) {
    const result = await this.resource(event);
    const id = this.getId(event);
    this.currentEvents.get(id).emit('processed', result);
    this.inject(() => result);
    this.currentEvents.delete(id);
  }

  async addEvent(event) {
    const id = this.getId(event);
    if (this.currentEvents.has(id)) {
      getLogger().info(`${id} Waiting for same resource to return`);
      return this.currentEvents.get(id).on('processed', processed => this.inject(() => processed));
    } else if (this.eventsInProgress === this.eventsPerPeriod) {
      return this.queue.push(event);
    } else {
      getLogger().info(`${id} running`);
      this.currentEvents.set(id, new EventEmmiter.EventEmitter());
    }

    this.eventsInProgress = this.eventsInProgress + 1;
    this.run(event);
    await this.wait(this.periodInMS);
    this.eventsInProgress = this.eventsInProgress - 1;
    this.emit('processed');
  }

  async process(event) {
    this.addEvent(event);
  }
}
