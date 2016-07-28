var mongoose = require('mongoose');
var env = require('./environment');

var dbUri = "mongodb://localhost/" + env.safe_title;

mongoose.connect(dbUri);

module.exports = mongoose;
