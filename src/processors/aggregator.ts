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
    const {timeout = [1000]} = this.input[0] || {};
    const {strategy = new MaxNumStrategy(3), store = new MemoryStore(), timer = new MemoryTimer(timeout) } = this.input[0] || {};
    this.strategy = strategy;
    this.store = store;
    this.timer = <any>timer;

    this.strategy.on('event', (event, status) => this.inject(() => {
      const {headers, body} = event;
      this.inject(() => this.aggregate({ headers: { ...headers }, body }, status));
    }));

    this.timer.on('event', (id, attempt) => {
      const storedEvent = this.store.getById(id);
      if (!storedEvent || storedEvent.headers.status === Store.STATUS.COMPLETED) {
        getLogger().debug(`[${this.id}] [timeout-${attempt}] [${id}] Already completed`);
        return;
      }
      const event = { headers: { ...storedEvent.headers }, body: storedEvent.body };
      event.headers.timeoutNum = attempt;
      this.inject(() => this.aggregate(event, Store.STATUS.TIMEOUT));
    });
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
    const storedEvent = await this.store.setStatus(this.getId(event), status);
    if (storedEvent) {
      const {body, headers} = storedEvent;
      return { body, headers: { ...event.headers, ...headers, previousStatus: event.headers.status } };
    }
  }

  async process(event) {
    const {body, headers} = await this.store.append(this.getId(event), this.getHeaders(event), this.getBody(event));
    if (body.length === 1) {
      this.timer.start(this.getId(event));
    }
    await this.strategy.check({ body, headers });
  }
}
