var mongoose = require('../config/database')
var Yelp_R = require("../models/yelp");
var Fsq_R = require("../models/fsq");
var async = require('async');
var rp = require('request-promise');
require('../server');

function getW3ws(rs, wcb) {
  var baseUri = "https://api.what3words.com/v2/reverse"
  var keyParam = "&key=" + process.env.W3W_KEY;
  rs = rs.filter(function(r) {
    return !r.w3w
  });
  async.eachLimit(rs, 100, function(r, acb){
    if(r.w3w) {
      acb();
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
  }, function(err){
    if(err) return wcb(err);
    wcb(null, "successfully updated all w3w's!")
  })
}

function getFsqList(list, wcb) {
  Fsq_R.find({}, function(err, rs){
    if(err) return wcb(err);
    rs = rs.concat(list)
    wcb(null, rs)
  });
}

function getYelpList(wcb) {
  Yelp_R.find({}, function(err, rs){
    if(err) return wcb(err);
    wcb(null, rs);
  });
}

async.waterfall([

  function(wcb) {
    getYelpList(wcb);
  },

  function(list, wcb) {
    getFsqList(list, wcb);
  },

  function(list, wcb) {
    getW3ws(list, wcb);
  }

], function(err, result){
  if(err) console.log(err);
  if(result) console.log(result);
  mongoose.disconnect();
});
