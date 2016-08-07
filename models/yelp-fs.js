var mongoose = require("../config/database.js");

mongoose.Promise = Promise;

var yelpFsRSchema = mongoose.Schema({
  name:         String,
  location:     String,
  category:     String,
  type:         String,
  lat:          Number,
  lon:          Number,
  w3w:          String
})

var Yelp_FS = mongoose.model("Yelp_FS", yelpFsRSchema);

module.exports = Yelp_FS;
