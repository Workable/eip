import Processor from './processor';
import { getLogger } from '../logger';
import PubSub from './throttler/pub-sub';
import MemoryPubSub from './throttler/memory-pub-sub';
import Timer from './aggregator/timer';
import MemoryTimer from './aggregator/memory-timer';

export default class ResourceThrottler extends Processor {
  public resource: Function;
  public timer: Timer;
  public pubSub: PubSub;

  constructor(options) {
    super(options);
    const { eventsPerPeriod = 1, periodInMS = 1000 } = this.input[0] || {};
    const {
      timer = new MemoryTimer([periodInMS]),
      resource = x => x,
      pubSub = new MemoryPubSub(eventsPerPeriod, periodInMS)
    } =
      this.input[0] || {};
    this.timer = timer;
    this.pubSub = pubSub;
    this.resource = resource;

    this.timer.on('event', async (id, attempt, delay) => {
      getLogger().debug(`[${this.id}] [timeout-${attempt}] [${id}] after ${delay} ms`);
      this.processQueue();
    });
  }

  async processQueue() {
    const events = await this.pubSub.getQueue();
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

  async run(event) {
    const result = await this.resource(event);
    const id = this.getId(event);
    await this.pubSub.unsubscribe(id, result);
    this.inject(() => result);
  }

  async addEvent(event) {
    const id = this.getId(event);
    if (await this.pubSub.subscribe(id, this.getPriority(event), event, processed => this.inject(() => processed))) {
      getLogger().info(`${id} Waiting for same resource to return`);
      return;
    }
    this.timer.start(id);
    getLogger().info(`${id} running`);
    this.run(event);
  }

  async process(event) {
    await this.addEvent(event);
  }
}
