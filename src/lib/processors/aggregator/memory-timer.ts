import Timer from './timer';
import { getLogger } from '../../logger';

export default class MemoryTimer extends Timer {
  start(id: string) {
    this.delays.forEach((delay, i) => {
      setTimeout(() => {
        getLogger().debug(`[memory-timer] [${id}] timeout-${i + 1} after ${delay} ms`);
        this.inject(id, i + 1);
      }, delay);
    });
  }
}
