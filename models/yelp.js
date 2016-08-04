var mongoose = require("../config/database.js");

mongoose.Promise = Promise;

var yelpRSchema = mongoose.Schema({
  name:         String,
  location:     String,
  category:     String,
  lat:          Number,
  lon:          Number,
  w3w:          String
})

var Yelp_R = mongoose.model("Yelp_R", yelpRSchema);

module.exports = Yelp_R;
