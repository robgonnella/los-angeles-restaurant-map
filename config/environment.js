var _ = require('lodash');

var localEnvVars = {
  title:      'hart-test-app',
  safe_title: 'hart-test-app'
};

module.exports = _.extend(process.env, localEnvVars);
