var mongoose = require('mongoose');
var env = require('./environment');

//using mongolab db
//switch to different uri for local database
var dbUri = process.env.MONGOLAB_URI
// var dbUri = "mongodb://localhost/" + env.safe_title;

mongoose.connect(dbUri);

module.exports = mongoose;
