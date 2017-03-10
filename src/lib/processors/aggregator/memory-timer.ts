import Timer from './timer';

export default class MemoryTimer extends Timer {
  start(id: string) {
    this.delays.forEach((delay, i) => {
      setTimeout(() => {
        this.inject(id, i + 1, delay);
      }, delay);
    });
  }
}
