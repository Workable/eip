import Processor from './processor';
import { getLogger } from '../logger';
import PubSub from './throttler/pub-sub';
import MemoryPubSub from './throttler/memory-pub-sub';
import Timer from './aggregator/timer';
import MemoryTimer from './aggregator/memory-timer';
import Queue from './throttler/queue';
import MemoryQueue from './throttler/memory-queue';

export default class ResourceThrottler extends Processor {
  public resource: Function;
  public timer: Timer;
  public pubSub: PubSub;
  public queue: Queue;

  constructor(options) {
    super(options);
    const { eventsPerPeriod = 1, periodInMS = 1000 } = this.input[0] || {};
    const {
      timer = new MemoryTimer([periodInMS]),
      resource = x => x,
      pubSub = new MemoryPubSub(eventsPerPeriod),
      queue = new MemoryQueue()
    } =
      this.input[0] || {};
    this.timer = timer;
    this.pubSub = pubSub;
    this.resource = resource;
    this.queue = queue;

    this.timer.on('event', async (id, attempt, delay) => {
      getLogger().debug(`[${this.id}] [timeout-${attempt}] [${id}] after ${delay} ms`);
      await this.pubSub.timeout();
      this.processQueue();
    });

    this.pubSub.on(PubSub.PROCESSED, (id, event, result) => {
      getLogger().debug(`[${this.id}] [${this.getRunId(event)}] - [${id}] Processed by another request `);
      this.inject(() => ({ ...result, headers: { id: this.getRunId(event) } }));
    });

    this.pubSub.on(PubSub.OVERFLOW, (id, event) => {
      const priority = this.getPriority(event);
      getLogger().debug(`[${this.id}] [${this.getRunId(event)}] - [${id}] Adding to queue with priority ${priority}`);
      this.queue.enqueue(id, priority, event);
    });
  }

  async processQueue() {
    const events = await this.queue.dequeue();
    if (events && events.length > 0) {
      events.forEach(e => {
        getLogger().debug(`[${this.id}] [${this.getId(e)}] Dequeuing...`);
        this.addEvent(e);
      });
    }
  }

  getId(event) {
    return event && event.headers && event.headers.correlationId;
  }

  getRunId(event) {
    return event && event.headers && event.headers.id;
  }

  getPriority(event) {
    return event.headers.priority || 0;
  }

  async run(event) {
    const result = await this.resource(event);
    const id = this.getId(event);
    await this.pubSub.unsubscribe(id, result);
    this.inject(() => ({ ...result, headers: { id: this.getRunId(event) } }));
  }

  async addEvent(event) {
    const id = this.getId(event);
    if (await this.pubSub.subscribe(id, event)) {
      getLogger().info(`[${this.id}] ${id} Will not run now`);
      return;
    }
    this.timer.start(id);
    getLogger().info(`[${this.id}] ${id} Running`);
    this.run(event);
  }

  async process(event) {
    await this.addEvent(event);
  }
}
