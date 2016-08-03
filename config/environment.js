var _ = require('lodash');

var localEnvVars = {
  title:      'yelp-fsq-example',
  safe_title: 'yelp-fsq-example'
};

module.exports = _.extend(process.env, localEnvVars);
