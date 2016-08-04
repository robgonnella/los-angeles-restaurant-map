var mongoose = require("../config/database.js");

mongoose.Promise = Promise;

var fsqRSchema = mongoose.Schema({
  name:         String,
  location:     String,
  category:     String,
  lat:          Number,
  lon:          Number,
  w3w:          String
})

var Fsq_R = mongoose.model("Fsq_R", fsqRSchema);

module.exports = Fsq_R;
