(function(){
  'use strict';

  angular
    .module('la-restaurant-map')
    .controller('MainController', MainController);

  MainController.$inject = ['$http'];

  function MainController($http){
    var vm = this;

    getRestaurants();


    function getRestaurants(){
      $http.get('http://fierce-oasis-92862.herokuapp.com/api/restaurants')
      .then(function(success){
        vm.restaurants = success.data.restaurants;
        initMap()
      })
      .catch(function(err){
        console.log("Get Restaurants Error -->", err);
      })
    }

    function initMap() {
      var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 34.052235, lng: -118.243683},
        zoom: 12
      });
      vm.restaurants.forEach(function(r) {
        var marker = new google.maps.Marker({
          position: {lat: r.lat, lng: r.lon},
          map: map,
          title: r.name
        })
      })
    }

  };

})();
