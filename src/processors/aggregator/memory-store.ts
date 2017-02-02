import Store from './store';
import * as Log from 'log4js';

const logger = Log.getLogger('[aggregator-eip->memory-store]')

export default class MemoryStore extends Store {
  private cache: Map<string, any>;

  constructor() {
    super();
    this.cache = new Map();
  }

  append(id: string, headers: any, body?: any) {
    const cache = this.cache.get(id) || { headers: {}, body: [] };
    Object.assign(cache.headers, headers);
    if (body) {
      cache.body.push(body);
    }
    this.cache.set(id, cache);
    return cache;
  }

  setStatus(id: string, status: string) {
    const cache = this.cache.get(id);
    if (!cache) {
      if (status === Store.STATUS.TIMEOUT) {
        logger.info(`[${id}] Already completed`);
      } else {
        return Error(`No entry found for id ${id}`);
      }
    }
    const {timesStatusChanged = 0} = cache.headers;
    Object.assign(cache.headers, { timesStatusChanged: timesStatusChanged + 1, status });
    if (status === Store.STATUS.COMPLETED) {
      this.cache.delete(id);
    } else {
      this.cache.set(id, cache);
    }
  }

  getById(id: string) {
    return this.cache.get(id);
  }
}
