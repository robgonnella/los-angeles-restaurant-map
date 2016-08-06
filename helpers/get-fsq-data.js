var rp = require('request-promise');
var async = require('async');
var debug = require('debug')('helper');
var n = require('nonce')();
var oauthSignature = require('oauth-signature');
var qs = require('querystring');
var _ = require('lodash');
var mongoose = require("../config/database")
var Yelp_FS = require("../models/yelp-fs");
require('../server');

//check if business exits in db first before saving
//allow different names at same location to account for
//multiple businesses in one location (i.e. strip mall)
function saveFsqVenues(venues, wcb) {
  console.log("saving new venues...")

  async.each(venues, function(venue, cb){

    var add = venue.location && venue.location.address ? venue.location.address : null;
    var city = venue.location && venue.location.city ? venue.location.city : null;

    var loc = add && city ? add + " " + city + " ca" : city ? city + " ca" : null
    var lat = venue.location && venue.location.lat ? venue.location.lat : null;
    var lon = venue.location && venue.location.lng ? venue.location.lng : null

    var newV = {
      name:       venue.name,
      location:   loc,
      category:   'restaurant',
      type:       'fsq',
      lat:        lat,
      lon:        lon
    }

    if ( ! ( newV.location || ( newV.lat && newV.lon ) ) ) return cb()

    newV.name = newV.name ? newV.name.toLowerCase() : newV.name;
    newV.location = newV.location ? newV.location.toLowerCase() : newV.location;
    newV.lat = newV.lat ? newV.lat.toFixed(6) : newV.lat;
    newV.lon = newV.lon ? newV.lon.toFixed(6) : newV.lon;

    Yelp_FS.create(newV, function(err, savedV){
      if(err) cb(err);
      console.log(`Saved FSQ Restaurant ${savedV.name} ${savedV.location} in FourSquare collection`)
      cb()
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
        console.log(e.stack)
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
function setQueryParams(ids, wcb) {
  console.log("creating query url array...");
  var baseUri = "https://api.foursquare.com/v2/venues/search"
  var near = "?near=Los%20Angeles%20CA";
  var category = "&categoryId="
  var client_id = "&client_id=" + process.env.FS_ID;
  var client_secret = "&client_secret=" + process.env.FS_SECRET;
  var v = "&v=20160731";
  var query = "&query=restaurant"
  var urls = [];
  ids.forEach(function(id){
    var url = baseUri + near + category + id + client_id + client_secret + v + query
    urls.push(url);
  });
  wcb(null, urls);
}

function getCategories(wcb) {
  console.log("getting category ids...")
  var baseUri = "https://api.foursquare.com/v2/venues/categories?"
  var client_id = "client_id=" + process.env.FS_ID;
  var client_secret = "client_secret=" + process.env.FS_SECRET;
  var v = "v=20160731";
  var url = baseUri + '&' + client_id + "&" + client_secret + "&" + v;
  var categoryIds = ["4d4b7105d754a06374d81259"]

  async.series([
    function(scb) {
      rp(url, function(err, data) {
        if(err) return wcb(err);
        var cats = JSON.parse(data.body).response.categories
        cats = cats.filter(function(cat){
          return cat.id === '4d4b7105d754a06374d81259'
        });
        cats[0].categories.forEach(function(cat){
          categoryIds.push(cat.id)
        });
        scb()
      });
    }
  ], function(err){
    if(err) return wcb(err);
    wcb(null, categoryIds)
  });
}

async.waterfall([

  function(wcb) {
    getCategories(wcb);
  },

  function(ids, wcb) {
    setQueryParams(ids, wcb);
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
