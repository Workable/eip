import Store from './store';
import { getLogger } from '../../logger';

export default class MemoryStore extends Store {
  private cache: Map<string, any>;

  constructor() {
    super();
    this.cache = new Map();
  }

  append(id: string, headers: any, body?: any) {
    const cache = this.cache.get(id) || { headers: { status: Store.STATUS.INITIAL }, body: [] };
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
        getLogger().debug(`[memory-store] [${id}] Already completed`);
        return;
      } else {
        throw new Error(`No entry found for id ${id}`);
      }
    }

    const {aggregationNum = 0} = cache.headers;
    Object.assign(cache.headers, { aggregationNum: aggregationNum + 1, status });
    if (status === Store.STATUS.COMPLETED) {
      this.cache.delete(id);
    } else {
      this.cache.set(id, cache);
    }
    return cache;
  }

  getById(id: string) {
    return this.cache.get(id);
  }
}
