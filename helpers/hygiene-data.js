var mongoose = require('../config/database')
var Yelp_FS = require('../models/yelp-fs');
var Rt = require('../models/restaurant');
var _ = require('lodash');
var async = require('async');
require('../server');


function saveList(totalList, wcb) {
  async.eachSeries(totalList, function(r, cb) {
    var newR = {
      name:     r.name,
      location: r.location,
      category: r.category,
      type:     r.type,
      lat:      r.lat,
      lon:      r.lon,
      w3w:      r.w3w
    }

    Rt.find({name: newR.name, w3w: newR.w3w}, function(err, foundR) {
      if(err) return cb(err);
      if(foundR.length) {
        console.log(`---------- ${foundR.length} restaurant with name ${foundR[0].name} at ${foundR[0].location} found in database already ---- skipped`)
        return cb()
      }
      Rt.create(newR, function(err, savedR) {
        if (err) return cb(err);
        console.log(`Saved restaurant ${savedR.name} ${savedR.location} in the hygienated Restaurant collection`);
        cb();
      })
    })
  }, function(err) {
    if(err) return wcb(err);
    wcb("successfully saved hygiened list in database")
    mongoose.disconnect();
  })
}


function getYelpFsList(wcb) {
  var totalList;

  Yelp_FS.find({}, function(err, rs) {
    if (err) return wcb(err);
    totalList = rs;
    console.log("Total List Length -->", totalList.length)
    wcb(null, totalList);
  });

}

async.waterfall([

  function(wcb) {
    getYelpFsList(wcb)
  },

  function(totalList, wcb) {
    saveList(totalList, wcb)
  }

], function(err, result) {
  if (err) return console.log(err);
  console.log(result);
})
