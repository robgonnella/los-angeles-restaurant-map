var rp = require('request-promise');
var async = require('async');
var debug = require('debug')('helper');
var n = require('nonce')();
var oauthSignature = require('oauth-signature');
var qs = require('querystring');
var _ = require('lodash');
var mongoose = require("../config/database")
var Restaurant = require("../models/restaurant");
require('../server');

//check if business exits in db first before saving
//allow different names at same location to account for
//multiple businesses in one location (i.e. strip mall)
function saveFsqVenues(venues, wcb) {
  console.log("saving new venues...")
  async.eachSeries(venues, function(venue, scb){
    var newVenue = {
      name:       venue.name,
      location:   venue.location.address + venue.location.city + venue.location.state,
      type:       'fsq',
      lat:        venue.location.lat,
      lon:        venue.location.lng
    }
    Restaurant.find({lat: newVenue.lat, lon: newVenue.lon, name: newVenue.name}, function(err, v){
      if(v.length) {
        console.log(`----------${v.length} restaurant(s) for ${newVenue.name} found in database already`);
        return scb();
      }
      console.log(`----------${v.length} restaurant(s) in database found for ${newVenue.name}`)
      Restaurant.create(newVenue, function(err, newV){
        if(err) wcb(err);
        console.log(`Saved FSQ Restaurant ${newV.name} in database`)
        return scb()
      });
    })
  }, function(err){
    if(err) return wcb(err)
    mongoose.disconnect();
    wcb(null, "process complete!");
  });
}

//requests data from yelp using url
//pass returned data to next function
function getFSQData(url, wcb){
  console.log("getting data from fs...")
  rp(url, function(err, data){
    if(err) return wcb(err);
    try {
      data = JSON.parse(data.body)
    } catch(e) {
      console.log(e.stack)
    }
    var venues = data.response.venues
    wcb(null, venues)
  });
}

//set up url query parameters
//pass url to next function in waterfall
function setQueryParams(wcb) {
  console.log("process beginning...creating fs url")
  var baseUri = "https://api.foursquare.com/v2/venues/search?near=Los%20Angeles%20CA"
  var client_id = "client_id=" + process.env.FS_ID;
  var client_secret = "client_secret=" + process.env.FS_SECRET;
  var v = "v=20160731";
  var url = baseUri + '&' + client_id + "&" + client_secret + "&" + v
  wcb(null, url);
}

module.exports = async.waterfall([

  function(wcb) {
    setQueryParams(wcb);
  },

  function(url, wcb) {
    getFSQData(url, wcb);
  },

  function(venues, wcb) {
    saveFsqVenues(venues, wcb);
  }
], function(err, result){
  if(err) console.log("Error -->",err)
  if(result) console.log("Result -->",result)
});
