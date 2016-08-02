var R = require("../models/restaurant");
var rp = require('request-promise')
var qs = require('querystring')
var debug = require('debug')('helper')
var geocoder = require("geocoder");
var async = require('async')

// returns all restaurants in database
var index = function(req,res,next) {
  R.find({}, function(err, rs){
    if(err) return res.status(500).json({error: err})
    res.json({restaurants: rs});
  })
}

// returns one specifuc restaurant based on id parameter
var show = function(req,res,next) {
  R.findById(req.params.id, function(err, foundR){
    if(err) return res.status(404).json({error: err})
    res.json({ restaurant: foundR });
  })
}

// creates new restaurant in database
var create = function(req,res,next) {
  var newR = {
    name     : req.body.name,
    location : req.body.location,
    type     : "hart",
    category : "Restaurant"
  }

  // require location for geolocation
  if(!newR.location) return res.status(500).json({error: "you must include location"})

  async.series([

    //geolocate new business and get lat lng
    function(cb) {
      geolocate(newR, function(err, data){
        if(err) return cb(err)
        cb()
      })
    },

    //access what 3 words api to populate w3w field
    function(cb) {
      getW3w(newR, function(err, data){
        if(err) return cb(err)
        cb()
      });
    },

    //check if business exists in db first before saving
    //allow different names at same address to account for multiple businesses in one location
    function(cb) {
      R.find({ lat: newR.lat, lon: newR.lon, name: newR.name}, function(err, foundR){

        if(err) return cb(err)
        if(foundR.length) return cb(`${foundR[0].name} already exits in the database`)

        R.create(newR, function(err, savedR){
          if(err) return cb(err);
          var result = {
            success: true,
            message: `successfully saved ${savedR.name} in the database`,
            data: savedR
          };
          cb(null, result);
        })
      })
    }
  ], function(err, result){
    if(err) res.status(500).json({error: err})
    if(result) res.json(result);
  })

}

//update business
var update = function(req,res,next) {
  R.findById(req.params.id, function(err, foundR){
    if(err) return res.status(500).json({
      error: err.message,
      message: 'Unable to find a business with that ID'
    });

    //change fields to new values
    for(var prop in req.body) {
      foundR[prop] = foundR[prop] === req.body[prop] ? foundR[prop] : req.body[prop];
    }

    //geolocate again just in case location was updated
    geolocate(foundR, function(err, updatedR){
      if(err) return res.status(500).json({error: err});

      //check to make sure changes don't conflict with existing records
      R.find({lat: updatedR.lat, lon: updatedR.lon, name: updatedR.name}, function(err, newFr){
        if(err) return res.status(500).json({error: err});
        if(newFr.length) return res.json({
          success: false,
          message: `another business with same name and address already exits in db`
        })

        //update w3w field for new info
        getW3w(updatedR, function(err, w3wUpdatedR){
          if(err) return res.status(500).json({error: err});
          //save updated record
          w3wUpdatedR.save(function(err, savedR){
            if(err) return res.json({error: err});
            res.json({
              success: true,
              message: `successfully updated info!`,
              data: savedR
            })
          });
        })
      })
    })
  })
}

//delete business
var destroy = function(req,res,next) {
  R.remove({_id: req.params.id}, function(err){
    if(err) res.status(500).json({
      error: err.message,
      message: "unable to find a business with that ID"
    });
    res.json({
      success: true,
      message: 'successfully deleted restaurant'
    });
  });
}

function geolocate(newR, cb) {
  geocoder.geocode(newR.location, function(err, data){
    if(err) return cb(err)
    if(data.results.length){
      newR.lat = data.results[0].geometry.location.lat
      newR.lon = data.results[0].geometry.location.lng
      cb(null, newR)
    }
    else {
      cb('invalid location')
    }
  });
}

function getW3w(r, cb){
  var url = "https://api.what3words.com/v2/reverse"
  var queryParams = {
    key: process.env.W3W_KEY,
    coords: `${r.lat},${r.lon}`
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
    r.w3w = data.words
    cb(null, r)
  });
}

module.exports = {
  index   : index,
  show    : show,
  create  : create,
  update  : update,
  destroy : destroy
}
