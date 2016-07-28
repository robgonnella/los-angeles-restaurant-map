var rp = require('request-promise');
var debug = require('debug')('helper')
var n = require('nonce')();
var oauthSignature = require('oauth-signature');
var qs = require('querystring');
var _ = require('lodash');
var Restaurant = require("../models/restaurant")

module.exports = function(app) {


  app.get('/api/yelp', function(req, res, next){
    var key = process.env.YELP_CONSUMER_KEY,
        secret = process.env.YELP_CONSUMER_SECRET,
        token = process.env.YELP_TOKEN,
        token_secret = process.env.YELP_TOKEN_SECRET,
        httpMethod = "GET",
        url = "https://api.yelp.com/v2/search",
        query_parameters = {
          location: 'Los+Angeles',
          category_filter: "restaurants"
        };

    var auth_params = {
      oauth_consumer_key : key,
      oauth_token : token,
      oauth_nonce : n(),
      oauth_timestamp : n().toString().substr(0,10),
      oauth_signature_method : 'HMAC-SHA1',
      oauth_version : '1.0'
    }
    var parameters = _.assign(query_parameters, auth_params);

    var signature = oauthSignature.generate(httpMethod, url, query_parameters, secret, token_secret, { encodeSignature: false});

    parameters.oauth_signature = signature;

    var paramURL = qs.stringify(parameters);

    var apiUrl = url + '?' + paramURL;

    rp(apiUrl)
      .then(function(data){
        data = JSON.parse(data);
        res.json(data)
        var businesses = data.businesses;
        businesses.forEach(function(business){
          var newRestaurant = {
            name:      business.name,
            location:  business.location.display_address[0],
            image_url: business.image_url,
            type:      'yelp',
            lat:       business.location.coordinate.latitude,
            lon:       business.location.coordinate.longitude
          }
          Restaurant.create(newRestaurant)
            .then(function(savedRest){
              debug(`Saved Yelp Restaurant ${savedRest.name} in the database`)
            })
            .catch(function(err){
              debug("Error Saving Restaurant", err)
            })
        })
    })
      .catch(function(err){
        debug('Yelp Get Data Error -->', err)
    });

  })

  app.get('/api/fsq', function(req,res,next){
    var baseUri = "https://api.foursquare.com/v2/venues/search?near=Los%20Angeles%20CA"
    var client_id = "client_id=" + process.env.FS_ID;
    var client_secret = "client_secret=" + process.env.FS_SECRET;
    var date = new Date()
    var year = date.getFullYear()
    var month = date.getMonth()+1
    var day = date.getDate()
    var v = "v=20160728"

    var url = baseUri + '&' + client_id + "&" + client_secret + "&" + v

    rp(url)
      .then(function(data){
        data = JSON.parse(data);
        res.json(data);
        var venues = data.response.venues
        venues.forEach(function(venue){
          var newVenue = {
            name:       venue.name,
            location:   venue.location.address + venue.location.city + venue.location.state,
            type:       'fs',
            lat:        venue.location.lat,
            lon:        venue.location.lng
          }
          Restaurant.create(newVenue)
            .then(function(newV){
              debug(`Saved FS Restaurant ${newV.name} in database`)
            })
            .catch(function(err){
              debug("Saving FS Error -->", err);
            })
        })
      })
      .catch(function(err){
        debug("Get FS Data Error -->", err);
      })
  })

}
