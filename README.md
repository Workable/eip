# aggregator-eip

Enterprise Integration Patterns for javascript.

This repo is based on [jkanschik/node-eip](https://github.com/jkanschik/node-eip) implements various eip patterns for javascript and mainly enhances the aggregator functionality.

## Installation

```
npm install --save eip
```

## Usage

```javascript
const eip = require('eip');
const aggregator = new eip.Route().aggregate();
eip.Route.register('newProcessor', processor);
aggregator.newProcessor();
```

## License

MIT
