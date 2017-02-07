import { init, getLogger } from './logger';
import Processor from './processors/processor';
let routeCounter = 1;
const config = {
  route: {
    retryLimit: 3,
    retryDelay: 1000
  },
  isErrorRoute: false
};

export default class Route {
  private errorRoute: Route;
  private error: (msg?: string | Function) => Route;
  private logger;

  constructor(
    private name = `Route-${routeCounter++}`,
    private options = <any>{},
    private processors: Processor[] = [],
  ) {
    this.options = { ...config, ...this.options };

    init(this.options.logger);
    this.logger = getLogger();

    if (!this.options.isErrorRoute) {
      this.errorRoute = new Route(`${this.name}.errorRoute`, { isErrorRoute: true })
        .error()
        .error((event) => `Stacktrace: ${event._error.stack}.`);
    }
  }

  async inject(event) {
    await this.processFirstProcessor(event);
    return this;
  }

  private async processFirstProcessor(event) {
    const [processor] = this.processors;
    if (processor) {
      await processor.safeProcess(event);
    }
  }

  async handleError(error, cb) {
    let attempts = 0;
    while (attempts < config.route.retryLimit) {
      try {
        this.logger.error(`${attempts} Retry limit not reached, try again in ${config.route.retryDelay} ms. Error ${error}`);
        await new Promise(resolve => setTimeout(resolve, config.route.retryDelay));
        attempts += 1;
        await cb();
      } catch (e) {
        error = e;
      }
    }
    this.errorRoute.inject({ _error: error });
  }

  static register(name, Processor) {
    Route.prototype[name] = function (...args) {
      const processor = new Processor({
        name,
        input: args,
        id: `${this.name}(${name}-${this.processors.length})`,
        previous: this.processors[this.processors.length - 1]
      });
      processor.on('error', async (error, cb) => await this.handleError(error, cb));
      this.processors.push(processor);
      return this;
    };
  }
};
