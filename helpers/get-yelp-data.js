var rp = require('request-promise');
var async = require('async');
var n = require('nonce')();
var oauthSignature = require('oauth-signature');
var qs = require('querystring');
var _ = require('lodash');
var mongoose = require('../config/database')
var Yelp_FS = require("../models/yelp-fs")
var app = require('../server');
var zipcodes = require('./zipcodes')

//check if business exits in db first before saving
//allow different names at same location to account for
//multiple businesses in one location (i.e. strip mall)
function saveYelpList(businesses, wcb){

  console.log('saving yelp businesses')

  async.eachSeries(businesses, function(business, cb){

    var add = business.location.address.length ? business.location.address[0].toLowerCase().trim() : null;
    var city = business.location.city ? business.location.city.toLowerCase().trim() : null;

    var loc = add && city ? add + ' ' + city + ' ca' : city ? city + ' ca' : null;
    var lat = business.location.coordinate && business.location.coordinate.latitude ? business.location.coordinate.latitude : null;
    var lon = business.location.coordinate && business.location.coordinate.longitude ? business.location.coordinate.longitude : null;

    var name = business.name ? business.name.toLowerCase().trim() : null;

    var newR = {
      name:          name,
      location:      loc,
      category:      'restaurant',
      type:          'yelp',
      lat:           lat,
      lon:           lon,
      latLonUpdated: false
    }

    if( ! ( newR.location || ( newR.lat && newR.lon ) ) ) return cb();

    if ( newR.location ) {
      var c = /,/gmi.test(newR.location);
      var a = /\b'/gmi.test(newR.location)
      newR.location = c ? newR.location.replace(/,/gmi, '') : newR.location
      newR.location = a ? newR.location.replace(/\b'/gmi, '') : newR.location
    }

    Yelp_FS.find({type: 'yelp', name: newR.name, location: newR.location}, function(err, foundR) {
      if(err) return cb(err)
      if(foundR.length) {
        console.log(`${foundR.length} restaurant named ${foundR[0].name} at ${foundR[0].location} found in database ----- skipped ----- Type: ${foundR[0].type}`);
        return cb()
      }
      Yelp_FS.create(newR, function(err, savedRest){
        if(err) return cb(err)
        console.log(`Saved Yelp Restaurant ${savedRest.name} in the yelp / foursquare collection`);
        cb()
      });
    })
  }, function(err){
    if(err) return wcb(err)
    wcb(null, "process complete!")
  })
}

//requests data from yelp using url
//pass returned data to next function
function getYelpData(urlArray, wcb) {
  console.log("Accessing Yelp Api...")
  var businesses = [];

  console.log(`Making ${urlArray.length} requests to Yelp API 20 at a time`)
  async.eachLimit(urlArray, 20, function(url, cb){
    rp(url, function(err, data){
      if(err) return cb(err);
      try {
        data = JSON.parse(data.body)
      } catch(e){
        console.log("Error Stack -->",e.stack)
      }
      businesses = businesses.concat(data.businesses);
      cb()
    })
  }, function(err){
    if(err) return wcb(err);
    console.log(`Retrieved ${businesses.length} businesses from yelp`)
    wcb(null, businesses)
  })
}

//get OAuth signature and set up url query paramenters
//pass url to next function in waterfall
function getOAuthUrls(wcb) {
  var key      = process.env.YELP_CONSUMER_KEY,
      secret       = process.env.YELP_CONSUMER_SECRET,
      token        = process.env.YELP_TOKEN,
      token_secret = process.env.YELP_TOKEN_SECRET,
      httpMethod   = "GET",
      baseUrl      = "https://api.yelp.com/v2/search",
      urlArray     = [];


  console.log("creating array of oauth urls with zipcode locations")
  async.each(zipcodes, function(zip, cb){
    var offset = 0;
    while (offset <= 150) {
      var query_parameters = {
        location:        zip,
        category_filter: "restaurants",
        offset:          offset.toString(),
        limit:           '20'
      };

      var auth_params = {
        oauth_consumer_key:      key,
        oauth_token:             token,
        oauth_nonce:             n(),
        oauth_timestamp:         n().toString().substr(0,10),
        oauth_signature_method:  'HMAC-SHA1',
        oauth_version:           '1.0'
      }

      var parameters = _.assign(query_parameters, auth_params);
      var signature = oauthSignature.generate(httpMethod, baseUrl, query_parameters, secret, token_secret, { encodeSignature: false});
      parameters.oauth_signature = signature;
      var paramURL = qs.stringify(parameters);
      var apiUrl = baseUrl + '?' + paramURL;
      urlArray.push(apiUrl);
      offset += 20;
    }
    cb();
  }, function(){
    wcb(null, urlArray);
  })
}



async.waterfall([

  function(wcb) {
    getOAuthUrls(wcb);
  },

  function(apiUrl, wcb) {
    getYelpData(apiUrl, wcb);
  },

  function(businesses, wcb) {
    saveYelpList(businesses, wcb);
  }

], function(err, result){
  if(err) console.log("Error -->", err);
  if(result) console.log("Result -->", result);
  mongoose.disconnect();
});
