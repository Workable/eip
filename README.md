# aggregator-eip

Aggregator Enterprise Integration Module

This repo enhances Aggregator Functionality and is based in this library:

https://github.com/jkanschik/node-eip

[![build status](https://secure.travis-ci.org/nikosd23/aggregator-eip.svg)](http://travis-ci.org/nikosd23/aggregator-eip)
[![dependency status](https://david-dm.org/nikosd23/aggregator-eip.svg)](https://david-dm.org/nikosd23/aggregator-eip)

## Installation

```
npm install --save aggregator-eip
```

## Usage

var Aggregator = require('aggregator-eip')

var aggr = new Aggregator({ repository:{ mongo_url:'' , options:''})

Aggregator.register('newProcessor', processor)

aggr.newProcessor()


## License

ISC
