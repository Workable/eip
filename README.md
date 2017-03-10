# eip

Enterprise Integration Patterns for javascript.

This repo is based on [jkanschik/node-eip](https://github.com/jkanschik/node-eip) implements various eip patterns for javascript and mainly enhances the aggregator functionality.

## Installation

```
npm install --save eip
```

## Usage


### Create a Route

```javascript
const eip = require('eip');
const route = new eip.Route('Route-0', {route: {retryLimit: 3, retryDelay: 1000}, isErrorRoute:false}, [])
```


### Add a processor to the Route

```javascript
route.process(event => event * 2).info()
```

### Inject events to Route

```javascript
route.inject(1);
// output: [2017-03-10 17:04:12.636] [INFO] [aggregator-eip] - [Route-0(info-1)] 2
route.inject(2);
// output:  [2017-03-10 17:04:13.082] [INFO] [aggregator-eip] - [Route-0(info-1)] 4
```

### Builtin Processors

```javascript
aggregate({timout=[1000], maxTimes=3}) // or
aggregate({timer= new Timer(), store = new Store(), strategy = new AggregationStrategy()})
// Timer, Store and AggregationStrategy are abstract classes exported by eip that can be extended.
// see eip-mongo and eip-rabbit for implementations of Timer on top of rabbitmq and Store on top of mongo

dispatch(route1, route2)
filter(event => event > 5); // or
filter(event => doAsyncStuff(event).then(result => result > 5)) // filter can accept conditions tha return a promise
process(event => [event, event]) // custom processor that transforms the event
process(event => doAsyncStuff(event)) // transform event returning a promise
throttle(10, 1000) // 10 events per second (1000 ms)

//logging
trace()
debug()
info()
warn()
error()
fatal()

// all logger scan transform the logging msg using a callback
// eg:
event => 'message to be logged:' + event;
```

## Aggregator example

```javascript
const aggregator = new eip.Route().aggregate({timeout: [1000], maxTimes: 3}).info();

aggregator.inject({
  headers: {
    id: 'the id to aggregate data',
    param: 'one'
  },
  body:'one'});

aggregator.inject({
  headers: {
    id: 'the id to aggregate data',
    param: 'two'
  },
  body:'two'});

aggregator.inject({
  headers: {
    id: 'the id to aggregate data',
    anotherParam: 'other'
  },
  body:'three'});


// it will be aggregated and log to output:
[2017-03-10 16:32:07.605] [INFO] [aggregator-eip] - [Route-1(info-1)] {"body":["one","two","three"],"headers":{"status":"COMPLETED","id":"the id to aggregate data","param":"two","anotherParam":"other","aggregationNum":1,"timeoutNum":0,"previousStatus":"INITIAL"}}
[2017-03-10 16:32:08.606] [DEBUG] [aggregator-eip] - [Route-1(aggregate-0)] [timeout-1] [1] Already completed


// we could have formatted the output using:
aggregator.info(aggregated => JSON.stringify(aggregated, null, 2));
[2017-03-10 16:38:05.484] [INFO] [aggregator-eip] - [Route-1(info-2)] {
  "body": [
    "one",
    "two",
    "three"
  ],
  "headers": {
    "status": "COMPLETED",
    "id": "the id to aggregate data",
    "param": "two",
    "anotherParam": "other",
    "aggregationNum": 1,
    "timeoutNum": 0,
    "previousStatus": "INITIAL"
  }
}
[2017-03-10 16:38:06.152] [DEBUG] [aggregator-eip] - [Route-1(aggregate-0)] [timeout-1] [the id to aggregate data] Already completed
```

## License

MIT
