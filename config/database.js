var mongoose = require('mongoose');
var env = require('./environment');

//using local db for now
//switch to different uri for production
var dbUri = "mongodb://localhost/" + env.safe_title;

mongoose.connect(dbUri);

module.exports = mongoose;
