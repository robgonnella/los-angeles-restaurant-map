var Restaurant = require("../models/restaurant");
var async = require('async');
var rp = require('request-promise');
require('../server');

module.exports = (function() {
  var apiUri = "https://api.what3words.com/v2/reverse"
  var keyParam = "&key=" + process.env.W3W_KEY;

  Restaurant.find({}, function(err, restaurants){
    if(err) return console.log("Error retrieving restaurants from database", err);
    async.each(restaurants, function(r, acb){
      if(r.w3w) {
        acb();
      } else {
        var coordsParam = `coords=${r.lat},${r.lon}`
        var url = apiUri + "?" + coordsParam + keyParam;
        rp(url, function(err, data){
          try {
            data = JSON.parse(data.body)
          }
          catch(e) {
            console.log(e.stack);
          }
          r.w3w = data.words
          r.save();
          console.log(`updated ${r.name} w3w to ${r.w3w}`)
          acb();
        })
      }
    }, function(err){
      if(err) return console.log(err)
      console.log("successfully updated all w3w's!")
      process.exit();
    })
  })
})();
