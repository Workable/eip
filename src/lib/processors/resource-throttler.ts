import Processor from './processor';
import * as EventEmmiter from 'events';
import { getLogger } from '../logger';
import MemoryPubSub from './throttler/memory-pub-sub';

let pubSub: MemoryPubSub;
export default class ResourceThrottler extends Processor {
  private eventsPerPeriod: number;
  private periodInMS: number;
  private resource: Function;

  constructor(options) {
    super(options);
    this.eventsPerPeriod = this.input[0];
    this.periodInMS = this.input[1] || 1000;
    this.resource = this.input[2] || (x => x);
    pubSub = new MemoryPubSub(this.eventsPerPeriod, this.periodInMS);
  }

  async processQueue() {
    const events = await pubSub.getQueue();
    if (events && events.length > 0) {
      events.forEach(e => this.addEvent(e));
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
    await pubSub.unsubscribe(id, result);
    this.inject(() => result);
  }

  async addEvent(event) {
    const id = this.getId(event);
    if (await pubSub.subscribe(id, event, processed => this.inject(() => processed), () => this.processQueue())) {
      getLogger().info(`${id} Waiting for same resource to return`);
      return;
    }
    getLogger().info(`${id} running`);
    this.run(event);
  }

  async process(event) {
    await this.addEvent(event);
  }
}
