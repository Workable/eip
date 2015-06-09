var uuid = require('uuid')
  , Util = {
    createEvent: function (body) {
      var event = body || {};
      if (event.body && event.headers && event.headers.id) {
        return event;
      }
      return {
        headers: {id: Util.createId()},
        body: event
      };
    },

    createId: function () {
      return uuid.v1();
    },

    /** Converts an arguments Object to an array of arguments. */
    argsToArray: function (args) {
      return Array.prototype.slice.call(args);
    },

    evalRHS: function (event, rhs) {
      var result;
      with (event) {
        eval("result = (" + rhs + ")")
      }
      return result;
    }

  };

exports.Util = Util;
