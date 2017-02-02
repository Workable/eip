import * as util from 'util';
let routeCounter = 1;
const config = {
  route: {
    retryLimit: 3,
    retryDelay: 1000
  },
  processor: {},
  logger: require('log4js').getLogger('[aggregator-eip]')
};

export default class Route {
  private errorRoute: Route;
  private error: (msg?: string | Function) => Route;

  constructor(private name = `Route${routeCounter++}`, private options = { isErrorRoute: false }, private processors = []) {
    if (!this.options.isErrorRoute) {
      this.errorRoute = new Route(`${this.name}.ErrorRoute`, { isErrorRoute: true })
        .error()
        .error((name, event) => `[${name}] Stacktrace: ${event._error.stack}.`);
    }
  }

  async inject(event) {
    await this.process(event);
    return this;
  }

  private async process(event) {
    const [processor] = this.processors;
    if (processor) {
      await processor.addEvent(event);
    }
  }

  register(name, Processor) {
    Route.prototype[name] = function (...args) {
      const processor = new Processor({
        name,
        input: args,
        id: `${this.name}#${this.processors.length}(${name})`,
        previous: this.processors[this.processors.length - 1]
      });
      processor.on('error', async function (error) {
        let attempts = 0;
        while (attempts < config.route.retryLimit) {
          try {
            config.logger.error(`Retry limit not reached, try again in ${config.route.retryDelay} ms. Error ${error}`);
            await new Promise(resolve => setTimeout(resolve, config.route.retryDelay));
            attempts += 1;
            event = await processor.process(event);
            return processor.emit('event', event)
          } catch (e) {
            error = e;
          }
          this.errorRoute.inject({ ...event, _error: error });
        }
      })
      this.processors.push(processor);
      return this;
    };
  }
};
