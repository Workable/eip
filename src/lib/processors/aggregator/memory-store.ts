import Store from './store';

export default class MemoryStore extends Store {
  private cache: Map<string, { headers: any, body: any }>;

  constructor() {
    super();
    this.cache = new Map();
  }

  async append(id: string, headers: any, body?: any) {
    const cache = this.cache.get(id) || { headers: { status: Store.STATUS.INITIAL }, body: [] };
    cache.body = cache.body.slice();
    cache.headers = Object.assign({}, cache.headers, headers);
    cache.body.push(body);
    this.cache.set(id, Object.assign({}, cache));
    return cache;
  }

  async setStatus(id: string, status: string) {
    const cache = this.cache.get(id);

    if (!cache) {
      throw new Error(`No entry found for id '${id}'`);
    }

    let { aggregationNum = 0, timeoutNum = 0 } = cache.headers;
    if (status === Store.STATUS.TIMEOUT) {
      timeoutNum += 1;
    }

    Object.assign(cache.headers, { aggregationNum: aggregationNum + 1, timeoutNum, status });

    if (status === Store.STATUS.COMPLETED) {
      this.cache.delete(id);
    } else {
      this.cache.set(id, cache);
    }

    return cache;
  }

  async getById(id: string) {
    return this.cache.get(id);
  }
}
