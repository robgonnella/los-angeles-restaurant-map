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
      category:   'Restaurant',
      lat:        venue.location.lat,
      lon:        venue.location.lng
    }
    Restaurant.find({lat: newVenue.lat, lon: newVenue.lon, name: newVenue.name}, function(err, v){
      if(v.length) {
        console.log(`----------${v.length} restaurant(s) for ${newVenue.name} found in database already`);
        return scb();
      }
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
  var baseUri = "https://api.foursquare.com/v2/venues/search?near=Los%20Angeles%20CA&categoryId="
  var client_id = "client_id=" + process.env.FS_ID;
  var client_secret = "client_secret=" + process.env.FS_SECRET;
  var v = "v=20160731";
  var urls = [];
  ids.forEach(function(id){
    var url = baseUri + id + '&' + client_id + "&" + client_secret + "&" + v
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
  var categoryIds = []

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

module.exports = async.waterfall([

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
