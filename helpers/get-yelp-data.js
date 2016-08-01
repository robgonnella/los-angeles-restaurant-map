var rp = require('request-promise');
var async = require('async');
var n = require('nonce')();
var oauthSignature = require('oauth-signature');
var qs = require('querystring');
var _ = require('lodash');
var mongoose = require('../config/database')
var Restaurant = require("../models/restaurant")
var app = require('../server');

//check if business exits in db first before saving
//allow different names at same location to account for
//multiple businesses in one location (i.e. strip mall)
function saveYelpList(businesses, wcb){
  async.eachSeries(businesses, function(business, scb){
    var newRestaurant = {
      name:      business.name,
      location:  business.location.display_address[0],
      image_url: business.image_url,
      type:      'yelp',
      lat:       business.location.coordinate.latitude,
      lon:       business.location.coordinate.longitude
    }
    Restaurant.find({lat: newRestaurant.lat, lon: newRestaurant.lon, name: newRestaurant.name}, function(err, r){
      if(r.length) {
        console.log(`----------${r.length} restaurant(s) for ${newRestaurant.name} found in database already`);
        return scb()
      }
      console.log(`----------${r.length} restaurant(s) found in database for ${newRestaurant.name}`)
      Restaurant.create(newRestaurant, function(err, savedRest){
        if(err) {
          wcb(err)
        } else {
          console.log(`Saved Yelp Restaurant ${savedRest.name} in the database`);
          return scb()
        }
      })
    });
  }, function(err){
    if(err) return wcb(err)
    wcb(null, "process complete!")
  })
}

//requests data from yelp using url
//pass returned data to next function
function getYelpData(apiUrl, wcb) {
  console.log("Accessing Yelp Api...")

  rp(apiUrl, function(err, data){
    if(err) return wcb(err);
    try {
      data = JSON.parse(data.body)
    } catch(e){
      console.log(e.stack)
    }
    var businesses = data.businesses;
    return wcb(null, businesses);
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
  url          = "https://api.yelp.com/v2/search",

  query_parameters = {
    location:        "Los+Angeles",
    category_filter: "restaurants"
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
  var signature = oauthSignature.generate(httpMethod, url, query_parameters, secret, token_secret, { encodeSignature: false});
  parameters.oauth_signature = signature;
  var paramURL = qs.stringify(parameters);
  var apiUrl = url + '?' + paramURL;
  wcb(null, apiUrl);

}


module.exports = async.waterfall([
  function(wcb){
    getOAuthSignature(wcb);
  },
  function(apiUrl, wcb){
    getYelpData(apiUrl, wcb);
  },
  function(businesses, wcb){
    saveYelpList(businesses, wcb);
  }
], function(err, result){
  if(err) console.log("Error -->", err);
  if(result) console.log("Result -->", result);
  mongoose.disconnect();
})
