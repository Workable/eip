import Processor from './processor';
import AggregationStrategy from './aggregator/aggregation-strategy';
import MaxNumStrategy from './aggregator/max-num-strategy';
import Store from './aggregator/store';
import MemoryStore from './aggregator/memory-store';
import Timer from './aggregator/timer';
import MemoryTimer from './aggregator/memory-timer';
import { getLogger } from '../logger';

export default class Aggregator extends Processor {
  private strategy: AggregationStrategy;
  private store: Store;
  private timer: Timer;

  constructor(options) {
    super(options);
    const { timeout = [1000] } = this.input[0] || {};
    const { maxTimes = 3 } = this.input[0] || {};
    const { strategy = new MaxNumStrategy(maxTimes), store = new MemoryStore(), timer = new MemoryTimer(timeout) } = this.input[0] || {};
    this.strategy = strategy;
    this.store = store;
    this.timer = <any>timer;

    this.strategy.on('event', (event, status) =>
      this.inject(() => this.aggregate(this.cloneHeaders(event), status))
    );

    this.timer.on('event', async (id, attempt, delay) => {
      const storedEvent = await this.store.getById(id);
      if (!storedEvent || storedEvent.headers.status === Store.STATUS.COMPLETED) {
        getLogger().debug(`[${this.id}] [timeout-${attempt}] [${id}] Already completed`);
        return;
      }
      getLogger().debug(`[${this.id}] [timeout-${attempt}] [${id}] after ${delay} ms`);
      this.inject(() => this.aggregate(this.cloneHeaders(storedEvent), Store.STATUS.TIMEOUT));
    });
  }

  cloneHeaders(event) {
    return { headers: { ...event.headers }, body: event.body };
  }

  getId(event) {
    return event.headers.id;
  }

  getBody(event) {
    return event.body;
  }

  getHeaders(event) {
    return event.headers;
  }

  async aggregate(event, status) {
    const store = await this.store.setStatus(this.getId(event), status);
    if (!store) {
      return;
    }
    const { body, headers } = store;
    getLogger().debug(`[${this.id}] [${headers.id}] [aggregation-${headers.aggregationNum}] \
[timeout-${headers.timeoutNum}] Aggregating event with status ${status}`);
    return { body, headers: { ...headers, previousStatus: event.headers.status } };
  }

  async process(event) {
    const { body, headers } = await this.store.append(this.getId(event), this.getHeaders(event), this.getBody(event));
    if (body.length === 1) {
      this.timer.start(this.getId(event));
    }
    await this.strategy.process({ body, headers });
  }
}
