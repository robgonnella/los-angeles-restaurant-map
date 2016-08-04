var rp = require('request-promise');
var async = require('async');
var n = require('nonce')();
var oauthSignature = require('oauth-signature');
var qs = require('querystring');
var _ = require('lodash');
var mongoose = require('../config/database')
var Yelp_R = require("../models/yelp")
var app = require('../server');

//check if business exits in db first before saving
//allow different names at same location to account for
//multiple businesses in one location (i.e. strip mall)
function saveYelpList(businesses, wcb){
  async.each(businesses, function(business, cb){
    var newR = {
      name:      business.name,
      location:  business.location.display_address.join(' ').replace(/,/gmi, '').toLowerCase(),
      category:  'Restaurant',
      lat:       business.location.coordinate.latitude,
      lon:       business.location.coordinate.longitude
    }
    Yelp_R.find({name: newR.name, location: newR.location}, function(err, foundR) {
      if (err) return cb(err);
      if (foundR.length) {
        console.log(`---------- ${foundR.length} restaurant named ${foundR[0].name} at ${foundR[0].location} already in database ------ skipped`);
        return cb();
      }
      Yelp_R.create(newR, function(err, savedRest){
        if(err) return wcb(err)
        console.log(`Saved Yelp Restaurant ${savedRest.name} in the Yelp collection`);
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
  async.each(urlArray, function(url, cb){
    rp(url, function(err, data){
      if(err) return cb(err);
      try {
        data = JSON.parse(data.body)
      } catch(e){
        console.log(e.stack)
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
function getOAuthSignature(wcb) {
  var key      = process.env.YELP_CONSUMER_KEY,
      secret       = process.env.YELP_CONSUMER_SECRET,
      token        = process.env.YELP_TOKEN,
      token_secret = process.env.YELP_TOKEN_SECRET,
      httpMethod   = "GET",
      baseUrl      = "https://api.yelp.com/v2/search",
      offset        = 0,
      urlArray     = [];

  while ( offset <= 980 ) {
    var query_parameters = {
      location:        "Los+Angeles",
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
    // offset += offset === 0 ? 21 : 20;
    offset += 20;
  }
  wcb(null, urlArray);
}


async.waterfall([

  function(wcb) {
    getOAuthSignature(wcb);
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
