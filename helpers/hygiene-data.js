var mongoose = require('../config/database')
var Yelp_FS = require('../models/yelp-fs');
var Rt = require('../models/restaurant');
var _ = require('lodash');
var async = require('async');
require('../server');


function saveList(list_to_save, wcb) {
  async.each(list_to_save, function(r, cb2) {
    var newR = {
      name:     r.name,
      location: r.location,
      category: r.category,
      lat:      r.lat,
      lon:      r.lon
    }

    Rt.find({name: newR.name, location: newR.location}, function(err, foundR) {
      if(err) return cb2(err);
      if(foundR.length) {
        console.log(`---------- ${foundR.length} restaurant with name ${foundR[0].name} at ${foundR[0].location} found in database already ---- skipped`)
        return cb2()
      }
      Rt.create(newR, function(err, savedR) {
        if (err) return cb2(err);
        console.log(`Saved restaurant ${savedR.name} ${savedR.location} in the hygienated Restaurant collection`);
        cb2();
      })
    })
  }, function(err) {
    if(err) return wcb(err);
    wcb("successfully saved hygiened list in database")
    mongoose.disconnect();
  })
}

function hygienateData(yList, fList, wcb) {

  var list_to_save = []

  async.each(fList, function(r, cb) {
    var name = {$regex: `${r.name}`, $options: 'i'}
    var loc = {$regex: `${r.location}`, $options: 'i'}
    Yelp_FS.find({type: 'yelp', name: name, location: loc}, function(err, foundR) {
      if (err) return cb(err);
      if (foundR.length) list_to_save.push(foundR[0])
      cb()
    })
  }, function(err){
    if (err) return wcb(err);
    console.log(`preparing to save ${list_to_save.length} restaurants in database...`)
    wcb(null, list_to_save);
  })
}

function getYelpFsList(wcb) {
  var yList;
  var fList;
  async.parallel([

    function (acb) {
      Yelp_FS.find({type: 'yelp'}, function(err, rs) {
        if (err) return acb(err);
        yList = rs;
        console.log("Yelp Length -->", yList.length)
        acb()
      });
    },

    function(acb) {
      Yelp_FS.find({type: 'fsq'}, function(err, rs) {
        if (err) return acb(err);
        fList = rs;
        console.log("FourSquare Length -->", fList.length)
        acb();
      });
    }
  ], function(err){
    if (err) return wcb(err);
    wcb(null, yList, fList);
  })
}

async.waterfall([

  function(wcb) {
    getYelpFsList(wcb)
  },

  function(yList, fList, wcb) {
    hygienateData(yList, fList, wcb);
  },

  function(list_to_save, wcb) {
    saveList(list_to_save, wcb)
  }

], function(err, result) {
  if (err) return console.log(err);
  console.log(result);
})
