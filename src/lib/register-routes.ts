import Route from './route';
import Dispatcher from './processors/dispatcher';
import Filter from './processors/filter';
import Logger from './processors/logger';
import Mapper from './processors/mapper';
import Throttler from './processors/throttler';
import ResourceThrottler from './processors/resource-throttler';
import Aggregator from './processors/aggregator';

Route.register('aggregate', Aggregator);
Route.register('dispatch', Dispatcher);
Route.register('filter', Filter);
Route.register('process', Mapper);
Route.register('throttle', Throttler);
Route.register('throttleResource', ResourceThrottler);

Route.register('trace', Logger);
Route.register('debug', Logger);
Route.register('info', Logger);
Route.register('warn', Logger);
Route.register('error', Logger);
Route.register('fatal', Logger);

