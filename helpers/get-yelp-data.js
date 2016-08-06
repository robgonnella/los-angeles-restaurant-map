var rp = require('request-promise');
var async = require('async');
var n = require('nonce')();
var oauthSignature = require('oauth-signature');
var qs = require('querystring');
var _ = require('lodash');
var mongoose = require('../config/database')
var Yelp_R = require("../models/yelp-fs")
var app = require('../server');

var la_neighborhoods = [
"Adams Normandie",
"Alhambra",
"Arleta",
"Arlington Heights",
"Arts District",
"Athens",
"Atwater Village",
"Baldwin Hills/Crenshaw",
"Bel Air",
"Beverly Crest",
"Beverly Grove",
"Beverly Hills",
"Beverlywood",
"Boyle Heights",
"Brentwood",
"Broadway-Manchester",
"Burbank",
"Canoga Park",
"Carthay",
"Central Alameda",
"Century City",
"Chatsworth",
"Chesterfield Square",
"Cheviot Hills",
"Chinatown",
"Culver City",
"Cypress Park",
"Del Rey",
"Downtown",
"Eagle Rock",
"East Hollywood",
"East Los Angeles",
"Echo Park",
"El Segundo",
"El Sereno",
"Elysian Park",
"Encino",
"Exposition Park",
"Fairfax",
"Florence",
"Florence-Firestone",
"Glassell Park",
"Glendale",
"Gramercy Park",
"Granada Hills",
"Green Meadows",
"Griffith Park",
"Hancock Park",
"Harbor City",
"Harbor Gateway",
"Harvard Heights",
"Harvard Park",
"Hermosa Beach",
"Highland Park",
"Historic South Central",
"Hollywood",
"Hollywood Hills",
"Hollywood Hills West",
"Huntington Park",
"Hyde Park",
"Jefferson Park",
"Koreatown",
"Ladera Heights",
"Lake Balboa",
"Lake View Terrace",
"Larchmont",
"Leimert Park",
"Lincoln Heights",
"Little Tokyo",
"Los Feliz",
"Manchester Square",
"Manhattan Beach",
"Mar Vista",
"Marina del Rey",
"Mid-City",
"Mid-Wilshire",
"Mission Hills",
"Montecito Heights",
"Mount Washington",
"North Hills",
"North Hollywood",
"Northridge",
"Pacific Palisades",
"Pacoima",
"Palms",
"Panorama City",
"Pasadena",
"Pico-Robertson",
"Pico-Union",
"Playa Vista",
"Playa del Rey",
"Porter Ranch",
"Rancho Park",
"Redondo Beach",
"Reseda",
"San Fernando",
"San Pedro",
"Santa Monica",
"Sawtelle",
"Sepulveda Basin",
"Shadow Hills",
"Sherman Oaks",
"Silver Lake",
"South Park",
"South Pasadena",
"Studio City",
"Sun Valley",
"Sunland",
"Sylmar",
"Tarzana",
"Terminal Island",
"Toluca Lake",
"Torrance",
"Tujunga",
"UCLA",
"Universal City",
"University Park",
"Valley Glen",
"Valley Village",
"Van Nuys",
"Venice",
"Vermont Knolls",
"Vermont Square",
"Vermont Vista",
"Vermont-Slauson",
"Vernon",
"View Park/Windsor Hills",
"Walnut Park",
"Watts",
"West Adams",
"West Hills",
"West Hollywood",
"West Los Angeles",
"Westchester",
"Westlake",
"Westmont",
"Westwood",
"Wilmington",
"Wilshire Center",
"Windsor Square",
"Winnetka",
"Woodland Hills"
]

//check if business exits in db first before saving
//allow different names at same location to account for
//multiple businesses in one location (i.e. strip mall)
function saveYelpList(businesses, wcb){

  console.log('saving yelp businesses')

  async.each(businesses, function(business, cb){

    var loc = business.location.display_address ? business.location.display_address.join(' ') : null;
    var lat = business.location.coordinate && business.location.coordinate.latitude ? business.location.coordinate.latitude : null;
    var lon = business.location.coordinate && business.location.coordinate.longitude ? business.location.coordinate.longitude : null;

    var newR = {
      name:      business.name,
      location:  loc,
      category:  'restaurant',
      type:      'yelp',
      lat:       lat,
      lon:       lon
    }

    if( ! ( newR.location || ( newR.lat && newR.lon ) ) ) return cb();

    newR.name = newR.name ? newR.name.toLowerCase() : newR.name;
    newR.location = newR.location ? newR.location.toLowerCase() : newR.location;
    newR.lat = newR.lat ? newR.lat.toFixed(6) : newR.lat;
    newR.lon = newR.lon ? newR.lon.toFixed(6) : newR.lon;


    Yelp_R.create(newR, function(err, savedRest){
      if(err) return cb(err)
      console.log(`Saved Yelp Restaurant ${savedRest.name} in the Yelp collection`);
      cb()
    });

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

  async.eachLimit(urlArray, 25, function(url, cb){
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
      urlArray     = [];


  async.each(la_neighborhoods, function(nb, cb){
    var offset = 0;
    while (offset <= 150) {
      var query_parameters = {
        location:        nb.replace(/\s/gmi, '+')+"+CA",
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
