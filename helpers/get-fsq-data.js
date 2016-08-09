var rp = require('request-promise');
var async = require('async');
var debug = require('debug')('helper');
var n = require('nonce')();
var oauthSignature = require('oauth-signature');
var qs = require('querystring');
var _ = require('lodash');
var mongoose = require("../config/database")
var Yelp_FS = require("../models/yelp-fs");
var zipcodes = require('./zipcodes')
require('../server');

//check if business exits in db first before saving
//allow different names at same location to account for
//multiple businesses in one location (i.e. strip mall)
function saveFsqVenues(venues, wcb) {
  console.log("saving new venues...")

  async.eachSeries(venues, function(venue, cb){

    var add = venue.location && venue.location.address ? venue.location.address.toLowerCase().trim() : null;
    var city = venue.location && venue.location.city ? venue.location.city.toLowerCase().trim() : null;

    var loc = add && city ? add + " " + city + " ca" : city ? city + " ca" : null
    var lat = venue.location && venue.location.lat ? venue.location.lat : null;
    var lon = venue.location && venue.location.lng ? venue.location.lng : null

    var name = venue.name ? venue.name.toLowerCase().trim() : null;

    var newV = {
      name:       name,
      location:   loc,
      category:   'restaurant',
      type:       'fsq',
      lat:        lat,
      lon:        lon
    }

    if ( ! ( newV.location || ( newV.lat && newV.lon ) ) ) return cb()

    newV.lat = newV.lat ? newV.lat.toFixed(6) : newV.lat;
    newV.lon = newV.lon ? newV.lon.toFixed(6) : newV.lon;

    if ( newV.location ) {
      var c = /,/gmi.test(newV.location);
      var a = /\b'/gmi.test(newV.location)
      newV.location = c ? newV.location.replace(/,/gmi, '') : newV.location
      newV.location = a ? newV.location.replace(/\b'/gmi, '') : newV.location

    }

    Yelp_FS.find({type: 'fsq', name: newV.name, location: newV.location}, function(err, foundV) {
      if(err) return cb(err)
      if(foundV.length) {
        console.log(`${foundV.length} restaurant named ${foundV[0].name} at ${foundV[0].location} found in database ----- skipped ----- Type: ${foundV[0].type}`);
        return cb()
      }
      Yelp_FS.create(newV, function(err, savedV){
        if(err) cb(err);
        console.log(`Saved FSQ Restaurant ${savedV.name} ${savedV.location} in yelp / foursquare collection`)
        cb()
      });
    });

  }, function(err){
    if(err) return wcb(err)
    mongoose.disconnect();
    wcb(null, "process complete!");
  });
}

//requests data from yelp using url
//pass returned data to next function
function getFSQData(urls, wcb){
  console.log("getting data from fs...")
  var venues = [];
  async.each(urls, function(url, cb){
    rp(url, function(err, data){
      if(err) return cb(err);
      try {
        data = JSON.parse(data.body)
      } catch(e) {
        console.log("Error Stack -->",e.stack)
      }
      venues = venues.concat(data.response.venues)
      cb()
    });
  }, function(err){
    if(err) return wcb(err);
    console.log(`Retrieved ${venues.length} venues from FourSquare`)
    wcb(null, venues)
  });
}

//set up url query parameters
//pass url to next function in waterfall
function setQueryParams(wcb) {

  console.log("creating query url array...");
  var baseUri = "https://api.foursquare.com/v2/venues/search"
  var near = "?near=";
  // var category = "&categoryId="
  var client_id = "&client_id=" + process.env.FS_ID;
  var client_secret = "&client_secret=" + process.env.FS_SECRET;
  var v = "&v=20160731";
  var query = "&query=restaurant"
  var urls = [];

  async.each(zipcodes, function(zip, cb) {
    var url = baseUri + near + zip + client_id + client_secret + v + query
    urls.push(url);
    cb();
  }, function(err) {
    if (err) return wcb(err);
    wcb(null, urls);
  });
}

async.waterfall([

  function(wcb) {
    setQueryParams(wcb);
  },

  function(urls, wcb) {
    getFSQData(urls, wcb);
  },

  function(venues, wcb) {
    saveFsqVenues(venues, wcb)
  }

], function(err, result){
  if(err) console.log("Error -->",err)
  if(result) console.log("Result -->",result)
  mongoose.disconnect();
});
