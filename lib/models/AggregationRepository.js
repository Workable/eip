var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  Promise = require('promise');

/**
 * Access to a repository to store aggregated exchanges to support pluggable implementations.
 *
 * @version
 */
var AggregationRepositorySchema = new Schema({
    correlationId: {type: String, unique: true},
    entries: [Schema.Types.Mixed]
  },
  {collection: 'aggregation_repository'});

/**
 * Add event
 * @param key
 * @param event
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.add = function (key, event) {
  return new Promise(function (fulfill, reject) {
    var upsertObj = {
      $push: {
        entries: event
      }
    };
    AggregationRepository.findOneAndUpdate({correlationId: key},
      upsertObj,
      {
        upsert: true
      }
    ).exec(function (err, data) {
        if (err) {
          reject(err);
        } else {
          fulfill(data);
        }
      });

  });
};

/**
 * Get events of specified correlationId
 * @param key
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.get = function (key) {
  return new Promise(function (fulfill, reject) {
    AggregationRepository.findOne({correlationId: key}).exec(function (err, data) {
      if (err) {
        reject(err);
      } else {
        fulfill(data);
      }
    });
  });
};

/**
 * Remove events for specified correlationId
 * @param key
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.remove = function (key) {
  return new Promise(function (fulfill, reject) {
    AggregationRepository.findOneAndRemove({correlationId: key}, function(err, data) {
      if (err) {
        reject(err);
      } else {
        fulfill(data);
      }
    });
  });
};

/**
 * Get all correlationIds info
 * @returns {*|exports|module.exports}
 */
AggregationRepositorySchema.statics.getKeys = function () {
  return new Promise(function (fulfill, reject) {
    AggregationRepository.find({}).exec(function (err, data) {
      if (err) {
        reject(err);
      } else {
        fulfill(data);
      }
    });
  });
};


var AggregationRepository = mongoose.model('AggregationRepository', AggregationRepositorySchema);
module.exports = AggregationRepository;
