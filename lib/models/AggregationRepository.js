var mongoose = require('mongoose'),
  Schema = mongoose.Schema

/**
 * Access to a repository to store aggregated exchanges to support pluggable implementations.
 *
 * @version
 */
  , AggregationRepositorySchema = new Schema({
      correlationId: {type: String, unique: true},
      contextId: {type: String},
      events: [Schema.Types.Mixed],
      status: {type: String}
    },
    {collection: 'aggregation_repository'});

AggregationRepositorySchema.index({correlationId: 1, contextId: 1}, {unique: true});

/**
 * Add event
 * @param correlationId
 * @param contextId
 * @param event
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.add = function (correlationId, contextId, event) {
  return new Promise(function (fulfill, reject) {
    event.time = new Date();
    var upsertObj = {
      $push: {
        events: event
      }
    };
    AggregationRepository.findOneAndUpdate({correlationId: correlationId, contextId: contextId},
      upsertObj,
      {
        upsert: true,
        new: true
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
 * @param correlationId
 * @param contextId
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.get = function (correlationId, contextId) {
  return new Promise(function (fulfill, reject) {
    AggregationRepository.findOne({correlationId: correlationId, contextId: contextId}).exec(function (err, data) {
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
 * @param correlationId
 * @param contextId
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.remove = function (correlationId, contextId) {
  return new Promise(function (fulfill, reject) {
    AggregationRepository.findOneAndRemove({correlationId: correlationId, contextId: contextId}, function(err, data) {
      if (err) {
        reject(err);
      } else {
        fulfill(data);
      }
    });
  });
};

/**
 * Marks as completed the specific correlationId, contextId tuple
 * @param correlationId
 * @param contextId
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.complete = function (correlationId, contextId) {
  return this.updateStatus(correlationId, contextId, 'completed');
};

/**
 * Marks as expired the specific correlationId, contextId tuple
 * @param correlationId
 * @param contextId
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.expire = function (correlationId, contextId) {
  return this.updateStatus(correlationId, contextId, 'expired');
};

/**
 * Updates the status of a specific correlationId, contextId tuple
 * @param correlationId
 * @param contextId
 * @param status
 * @returns {Promise}
 */
AggregationRepositorySchema.statics.updateStatus = function (correlationId, contextId, status) {
  return new Promise(function (fulfill, reject) {
    var updateObj = {
      status: status
    };
    AggregationRepository.findOneAndUpdate({correlationId: correlationId, contextId: contextId},
      updateObj).exec(function (err, data) {
        if (err) {
          reject(err);
        } else {
          fulfill(data);
        }
      });
  });
};

/**
 * Get all correlationIds info for a specific contextId
 * @param contextId
 * @returns {Promise}
 * @returns {*|exports|module.exports}
 */
AggregationRepositorySchema.statics.getKeys = function (contextId) {
  return new Promise(function (fulfill, reject) {
    AggregationRepository.find({contextId: contextId}).exec(function (err, data) {
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
