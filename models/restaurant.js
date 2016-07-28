var mongoose = require("../config/database.js");

mongoose.Promise = Promise;

var restaurantSchema = mongoose.Schema({
  name:         String,
  location:     String,
  description:  String,
  yelp:         Boolean,
  lat:          Number,
  lon:          Number
})

var Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
