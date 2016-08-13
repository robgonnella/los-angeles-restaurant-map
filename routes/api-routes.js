var express = require('express');
var router = express.Router()
var restaurantController = require('../controllers/restaurants')
var rp = require('request-promise')

//create RESTful API routes
module.exports = function(app) {

  app.use('/api', router)

  router.get('/restaurants', restaurantController.index);
  router.get('/restaurant/:id', restaurantController.show);
  router.post('/restaurants', restaurantController.create);
  router.put('/restaurant/:id', restaurantController.update);
  router.delete('/restaurant/:id', restaurantController.destroy);

}
