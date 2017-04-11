import AggregationStrategy from './aggregation-strategy';

export default class MaxNumStrategy extends AggregationStrategy {
  constructor(public times) {
    super();
  }

  process(event) {
    if (event.body && event.body.length === this.times) {
      this.inject(event);
    }
  }
}
