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
      res.json(data)
      debug("Data -->", data)
    })
      .catch(function(err){
      debug('Yelp Get Data Error -->', err)
    });

  })

}
