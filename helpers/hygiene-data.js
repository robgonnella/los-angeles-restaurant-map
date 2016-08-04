var Yelp_R = require('../models/yelp');
var Fsq_R = require('../models/fsq');
var _ = require('lodash');
var async = require('async');

function getYelpList(wcb) {
  var yelpList = [];
  Yelp_R.find({}, function(err, rs) {
    if (err) wcb(err);
    yelpList = rs;
    wcb(null, yelpList)
  });
}

function getFsqList(list, wcb) {
  var fsqList = [];
  Fsq_R.find({}, function(err, rs) {
    if(err) wcb(err);
    fsqList = rs;
    var total = fsqList.concat(list)
    wcb(null, total)
  })
}

function hygieneData(y, f) {

}

async.waterfall([

  function(wcb) {
    getYelpList(wcb)
  },

  function(list, wcb) {
    getFsqList(list, wcb)
  }

], function(err, list) {
  if (err) console.log(err);
  if (list) {
    console.log("Callback List Length -->", list.length)
    var h_list = _.uniqBy(list, 'lat', 'lon', 'name');
    console.log("H List Length -->", h_list.length)
  }
})
