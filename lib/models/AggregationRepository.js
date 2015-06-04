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
 * @param correlationId
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


AggregationRepositorySchema.statics.remove = function (key) {
  return new Promise(function (fulfill, reject) {
    AggregationRepository.remove({correlationId: key}).exec(function (err, data) {
      if (err) {
        reject(err);
      } else {
        fulfill(data);
      }
    });
  });
};

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

//
//AccountSchema.statics.createFromVisitor = function(accountId, userId, visitorId, cb) {
//  //find all visitors that correspond to the same user
//  //User.getVisitors(userId, visitorId).
//  Visitor.getVisits([visitorId]).then(function(visitors) {
//    var first = visitors[0];
//    return Account.updateWithVisitor(accountId, userId, first, visitors);
//  }).done(function(data) {
//    cb(null, data);
//  }, cb);
//};
//
//AccountSchema.statics.updateSourceAndChannel = function (accountId, user, source, channel) {
//  return new Promise(function (fulfill, reject) {
//
//    var updateObj = {
//      first_channel: channel,
//      first_source: source,
//      edited_by: user,
//      edited_date: new Date()
//    };
//    updateObj.$unset= {
//      first_date: 1,
//      first_utm_source: 1,
//      first_utm_medium: 1,
//      first_utm_campaign: 1,
//      first_utm_content: 1,
//      first_utm_term: 1,
//      first_page: 1,
//      first_section: 1
//    };
//
//    Log.debug('updating ' + JSON.stringify(updateObj));
//    Account.findOneAndUpdate({account_id: accountId},
//      updateObj)
//      .exec(function (err, data) {
//        if (err) {
//          reject(err);
//        } else {
//          fulfill(data);
//        }
//      });
//  });
//};
//
//AccountSchema.statics.getVisitStats = function(match) {
//  match = match || {};
//  return new Promise(function(fulfill, reject) {
//    Account.aggregate(
//      {
//        $match: match
//      },
//      {
//        $group: {
//          _id: '1',
//          visits_organic: {$sum: "$visits_organic"},
//          visits_referral: {$sum: "$visits_referral"},
//          visits_direct: {$sum: "$visits_direct"},
//          visits_email: {$sum: "$visits_email"},
//          visits_social: {$sum: "$visits_social"},
//          visits_cpc: {$sum: "$visits_cpc"},
//          visits_feature: {$sum: "$visits_feature"},
//          visits_total: {$sum: "$visits_total"}
//        }
//      }, function(err, data) {
//        if(err) {
//          reject(err);
//        } else {
//          if(data.length === 1) {
//            fulfill(data[0]);
//          } else {
//            reject("Invalid number of data returned");
//          }
//        }
//      });
//  });
//};


/*

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

 */
