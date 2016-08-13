var _ = require('lodash');

var localEnvVars = {
  title:      'la-restaurant-map',
  safe_title: 'la-restaurant-map'
};

module.exports = _.extend(process.env, localEnvVars);
