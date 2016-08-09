var mongoose = require('../config/database')
var Yelp_FS = require('../models/yelp-fs');
var async = require('async');
var rp = require('request-promise');
require('../server');

function updateLatLon(rList, wcb) {
  var baseUri = "https://api.what3words.com/v2/forward"
  var keyParam = "&key=" + process.env.W3W_KEY;
  rList = rList.filter(function(r) {
    return r.w3w.length > 0
  });
  async.eachLimit(rList, 100, function(r, cb) {
    if (!r.w3w.length) return cb()
    var addrParam = 'addr=' + r.w3w;
    var url = baseUri + '?' + addrParam + keyParam

    rp(url, function(err, data) {
      if (err) return cb(err);
      try {
        data = JSON.parse(data.body)
      }
      catch(e) {
        console.log("Parsing Error -->", e.stack);
      }
      r.lat = data.geometry.lat
      r.lon = data.geometry.lng
      r.save();
      console.log(`updated ${r.name} lat / lon to ${r.lat}, ${r.lon}`)
      cb();
    })
  }, function(err) {
    if (err) return wcb(err);
    wcb(null, "successfully updated all w3w's!")
  })
}

function getW3ws(rList, wcb) {
  var baseUri = "https://api.what3words.com/v2/reverse"
  var keyParam = "&key=" + process.env.W3W_KEY;
  rList = rList.filter(function(r) {
    return !r.w3w.length
  });
  async.eachLimit(rList, 100, function(r, acb){
    if(r.w3w) {
      return acb();
    } else {
      var coordsParam = `coords=${r.lat},${r.lon}`
      var url = baseUri + "?" + coordsParam + keyParam;
      rp(url, function(err, data){
        if(err) return acb(err);
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
  }, function(err) {
    if(err) return wcb(err);
    Yelp_FS.find({}, function(err, rList) {
      if(err) return wcb(err);
      wcb(null, rList);
    });
  })
}

function getList(wcb) {
  Yelp_FS.find({}, function(err, rList){
    if(err) return wcb(err);
    wcb(null, rList);
  });
}

async.waterfall([

  function(wcb) {
    getList(wcb);
  },

  function(rList, wcb) {
    getW3ws(rList, wcb);
  },

  function(rList, wcb) {
    updateLatLon(rList, wcb);
  }

], function(err, result){
  if(err) console.log(err);
  if(result) console.log(result);
  mongoose.disconnect();
});
