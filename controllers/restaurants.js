var R = require("../models/restaurant");
var rp = require('request-promise')
var qs = require('querystring')
var debug = require('debug')('helper')
var geocoder = require("geocoder");
var async = require('async')

var index = function(req,res,next) {
  R.find({}, function(err, rs){
    if(err) return res.json({error: err})
    res.json({restaurants: rs});
  })
}

var show = function(req,res,next) {
  R.findById(req.params.id, function(err, foundR){
    if(err) return res.json({error: err})
    res.json({ restaurant: foundR });
  })
}

var create = function(req,res,next) {
  var newR = {
    name     : req.body.name,
    location : req.body.location,
    type     : "hart"
  }

  if(!newR.location) return res.json({error: "you must include location"})

  async.series([

    function(cb) {
      geocoder.geocode(newR.location, function(err, data){

        if(err) return cb(err)

        newR.lat = data.results[0].geometry.location.lat
        newR.lon = data.results[0].geometry.location.lng
        cb()
      });
    },

    function(cb) {
      var url = "https://api.what3words.com/v2/reverse"
      var queryParams = {
        key: process.env.W3W_KEY,
        coords: `${newR.lat},${newR.lon}`
      }
      var paramsUrl = qs.stringify(queryParams);
      var apiUrl = url + '?' + paramsUrl;

      rp(apiUrl, function(err, data){
        if(err) return cb(err)
        try{
          data = JSON.parse(data.body)
        }
        catch(e) {
          console.log(e.stack);
        }
        newR.w3w = data.words
        cb()
      });
    },

    function(cb) {
      R.find({ lat: newR.lat, lon: newR.lon }, function(err, r){

        if(err) return cb(err)
        if(r.length) return cb(null, `${r[0].name} already exits in the database`)

        R.create(newR, function(err, savedR){
          if(err) return cb(err);
          cb({
            success: true,
            message: `successfully saved ${savedR.name} in the database`,
            data: savedR
          });
        })
      })
    }
  ], function(result){
    if(result) res.json(result);
  })

}

var update = function(req,res,next) {
  R.findById(req.params.id, function(err, foundR){
    if(err) res.json({error: err});
    for(var prop in req.body) {
      foundR[prop] = foudR[prop] === req.body[prop] ? foundR[prop] : req.body[prop];
    }
    foundR.save();
  })
}

var destroy = function(req,res,next) {
  R.remove({_id: req.params.id}, function(err){
    if(err) res.json({error: err});
    res.json({
      success: true,
      message: 'successfully deleted restaurant'
    });
  });
}

module.exports = {
  index   : index,
  show    : show,
  create  : create,
  update  : update,
  destroy : destroy
}
