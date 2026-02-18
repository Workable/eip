import './register-routes';
import Route from './route';
import Processor from './processors/processor';
import Store from './processors/aggregator/store';
import Timer from './processors/aggregator/timer';
import PubSub from './processors/throttler/pub-sub';
import Queue from './processors/throttler/queue';
import AggregationStrategy from './processors/aggregator/aggregation-strategy';
import { init as initLogger, getLogger } from './logger';

export { Route, Processor, Store, Timer, PubSub, Queue, AggregationStrategy, initLogger, getLogger };
export default { Route, Processor, Store, Timer, PubSub, Queue, AggregationStrategy, initLogger, getLogger };
