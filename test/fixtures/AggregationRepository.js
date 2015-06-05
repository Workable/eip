
exports.AggregationRepository = {
  "1" : {
    correlationId: "123456",
    contextId: "Route1",
    events: [
      {
        type: 'Clearbit',
        name: 'John Doe',
        facebookUrl: 'https://www.facebook.com/john_doe',
        email: 'johnny@gmail.com'
      },
      {
        type: 'Connect6',
        name: 'John Doe',
        twitterHandle: 'https://www.twitter/johnny'
      }
    ],
    status: "initial"
  },
  "2" : {
    correlationId: "456789",
    contextId: "Route1",
    events: [
      {
        type: 'Fullcontact',
        name: 'Natalie Sung',
        facebookUrl: 'https://www.facebook.com/natalie_sung',
        email: 'natalie@gmail.com'
      }
    ],
    status: "initial"
  },
  "3" : {
    correlationId: "678910",
    contextId: "Route2",
    events: [
      {
        type: 'Peoplegraph',
        name: 'David Bodelos',
        facebookUrl: 'https://www.facebook.com/david_bodelos',
        email: 'david@gmail.com'
      }
    ],
    status: "initial"
  }
};
