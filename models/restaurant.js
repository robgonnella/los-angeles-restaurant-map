var mongoose = require("../config/database.js");

mongoose.Promise = Promise;

var restaurantSchema = mongoose.Schema({
  name:          String,
  location:      String,
  category:      String,
  type:          String,
  lat:           Number,
  lon:           Number,
  latLonUpdated: Boolean,
  w3w:           String
})

var Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
