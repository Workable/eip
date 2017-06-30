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

    this.pubSub.on(PubSub.PROCESSED, (correlationId, event, result) => {
      const id = this.getRunId(event);
      getLogger().debug(`[${this.id}] [${id}] [${correlationId}] Processed`);
      this.inject(() => ({ ...result, headers: { id: this.getRunId(event) } }));
    });

    this.pubSub.on(PubSub.OVERFLOW, (correlationId, event) => {
      const priority = this.getPriority(event);
      const id = this.getRunId(event);
      getLogger().debug(
        `[${this.id}] [${this.getRunId(event)}] [${id}] [${correlationId}] Adding to queue with priority ${priority}`
      );
      this.queue.enqueue(correlationId, priority, event);
    });
  }

  async processQueue() {
    const events = await this.queue.dequeue();
    if (events && events.length > 0) {
      events.forEach(e => {
        getLogger().debug(`[${this.id}] [${this.getRunId(e)}][${this.correlationId(e)}] Dequeuing...`);
        this.addEvent(e, true);
      });
    }
  }

  correlationId(event) {
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
    const id = this.correlationId(event);
    await this.pubSub.publish(id, result);
  }

  async addEvent(event, fromQueue = false) {
    const correlationId = this.correlationId(event);
    const id = this.getRunId(event);
    if (await this.pubSub.subscribe(correlationId, event, !fromQueue)) {
      getLogger().info(`[${this.id}] [${id}] [${correlationId}] Will not run now`);
      return;
    }
    this.timer.start(`${id} - ${correlationId}`);
    getLogger().info(`[${this.id}] [${id}] [${correlationId}] Running`);
    this.run(event);
  }

  async process(event) {
    await this.addEvent(event);
  }
}
