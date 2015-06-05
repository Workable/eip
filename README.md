# aggregator-eip

Aggregator Enterprise Integration Module

This repo enhances Aggregator Functionality and is based on this library:

https://github.com/jkanschik/node-eip

[![build status](https://secure.travis-ci.org/nikosd23/aggregator-eip.svg)](http://travis-ci.org/nikosd23/aggregator-eip)
[![dependency status](https://david-dm.org/nikosd23/aggregator-eip.svg)](https://david-dm.org/nikosd23/aggregator-eip)

## Installation

```
npm install --save aggregator-eip
```

## Usage

var Aggregator = require('aggregator-eip')

var aggr = new Aggregator({ db: ''})

Aggregator.register('newProcessor', processor)

aggr.newProcessor()


## To locally test your repository functions



 Promise = require('promise');

 Promise.prototype.async = function () {
 var result = {};
 this.then(function (data) {
 result.data = data;
 }, function (error) {
 result.error = error.stack;
 });
 return result;
 };

 var options = { db: 'mongodb://localhost/dev-development', server: {socketOptions: { keepAlive: 1 } } };
 var mongoose = require('mongoose');
 mongoose.connect(options.db, options.server);

 agg = require('./lib/models/AggregationRepository')

 var a = agg.add('123',{name:'Nikos Dimos'}).async()

 // How to start with debugger in tests:
 node debug --harmony ./node_modules/.bin/_mocha



## License

ISC
