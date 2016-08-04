var mongoose = require('../config/database')
var Yelp_R = require('../models/yelp');
var Fsq_R = require('../models/fsq');
var Rt = require('../models/restaurant');
var _ = require('lodash');
var async = require('async');

function hygienateData(list, wcb) {

  var h_list = _.uniqBy(list, 'w3w', 'name');

  console.log(`preparing to save ${h_list.length} restaurants in database...`)

  async.each(h_list, function(r, cb) {
    console.log(r)
    Rt.find({name: r.name, w3w: r.w3w}, function(err, foundR) {
      if(err) return cb(err);
      if(foundR.length) {
        console.log(`---------- ${foundR.length} restaurant with name ${foundR[0].name} at ${foundR[0].location} found in database already ---- skipped`)
        return cb()
      }
      Rt.create(r, function(err, newR) {
        if (err) return cb(err);
        console.log(`Saved restaurant ${newR.name} in the hygienated Restaurant collection`);
        cb();
      })
    })
  }, function(err) {
    if(err) return wcb(err);
    wcb("successfully saved hygiened list in database")
  })
}

function getFsqList(list, wcb) {
  var fsqList = [];
  Fsq_R.find({}, function(err, rs) {
    if(err) wcb(err);
    fsqList = rs;
    console.log("FSQ Length -->", fsqList.length)
    var total = fsqList.concat(list)
    console.log("TOTAL LENGTH -->", total.length)
    wcb(null, total)
  })
}

function getYelpList(wcb) {
  var yelpList = [];
  Yelp_R.find({}, function(err, rs) {
    if (err) wcb(err);
    yelpList = rs;
    console.log("Yelp Length -->", yelpList.length)
    wcb(null, yelpList)
  });
}

async.waterfall([

  function(wcb) {
    getYelpList(wcb)
  },

  function(list, wcb) {
    getFsqList(list, wcb)
  },

  function(list, wcb) {
    hygienateData(list, wcb);
  }

], function(err, result) {
  if (err) return console.log(err);
  console.log(result);
  mongoose.disconnect();
  mongoose.disconnect();
  mongoose.disconnect();
})
