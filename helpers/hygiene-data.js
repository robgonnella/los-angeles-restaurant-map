var mongoose = require('../config/database')
var Yelp_FS = require('../models/yelp-fs');
var Rt = require('../models/restaurant');
var _ = require('lodash');
var async = require('async');
require('../server');

function hygienateData(yList, fList, wcb) {

  yList.forEach(function(l) {
    var c = (/,/gmi).test(l.location);
    if ( c ) {
      l.location = l.location.replace(/,/gmi, '')
    }
    delete l._id
    delete l.type
  });

  fList.forEach(function(l) {
    var c = (/,/gmi).test(l.location);
    if ( c ) {
      l.location = l.location.replace(/,/gmi, '')
    }
    delete l._id
    delete l.type
  });

  var h_list = _.intersectionWith(ylist, fList, _.isEqual)

  console.log(`preparing to save ${h_list.length} restaurants in database...`)

  async.each(h_list, function(r, cb) {
    var newR = {
      name:     r.name,
      location: r.location,
      category: r.category,
      lat:      r.lat,
      lon:      r.lon
    }

    Rt.find({name: newR.name, location: newR.location}, function(err, foundR) {
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
  var yList;
  var fList;
  async.parallel([

    function (acb) {
      Yelp_FS.find({type: 'yelp'}, function(err, rs) {
        if (err) wcb(err);
        yList = rs;
        console.log("Yelp Length -->", yList.length)
        acb()
      });
    },

    function(acb) {
      Yelp_FS.find({type: 'fsq'}, function(err, rs) {
        if (err) wcb(err);
        fList = rs;
        console.log("FourSquare Length -->", fList.length)
        acb();
      });
    }
  ], function(err){
    if (err) return wcb(err);
    wcb(null, yList, fList)
  })
}

async.waterfall([

  function(wcb) {
    getYelpFsList(wcb)
  },

  function(yList, fList, wcb) {
    hygienateData(yList, fList, wcb);
  }

], function(err, result) {
  if (err) return console.log(err);
  console.log(result);
})
