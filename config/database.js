var mongoose = require('mongoose');
var env = require('./environment');

var dbUri = "mongodb://localhost/" + env.SAFE_TITLE;

mongoose.connect(dbUri);

module.exports = mongoose;
