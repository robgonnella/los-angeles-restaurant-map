(function(){
  'use strict';

  angular
    .module('la-restaurant-map')
    .controller('MainController', MainController);

  MainController.$inject = ['$http', '$window'];

  function MainController($http, $window){
    var vm = this;

    getRestaurants()

    function getRestaurants(){
      $http.get('https://fierce-oasis-92862.herokuapp.com/api/restaurants')
      .then(function(success){
        vm.restaurants = success.data.restaurants;
        initMap()
      })
      .catch(function(failure){
        console.log("Get Restaurants Error -->", failure);
      })
    }

    function createContent(restaurant) {
      var html = `<div id='info-window'> <p> Name: ${restaurant.name} </p> <p> Location: ${restaurant.location} </p> </div>`
      return html
    }

    function initMap() {

      var infoWindow = new google.maps.InfoWindow({
        content: "<p> This is Nutso! </p>"
      });

      console.log("InfoWindow Instance -->", infoWindow)
      // $window.navigator.geolocation.getCurrentPosition(function(position) {
      //   var map = new google.maps.Map(document.getElementById('map'), {
      //     center: {lat: position.coords.latitude, lng: position.coords.longitude},
      //     zoom: 18
      //   });
      // });
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
        marker.addListener('click', function() {
          inforWindow.content = createContent(r)
          marker['infoWindow'] = infoWindow;
          this['infoWindow'].open(map, this)
        });
      })
    }

  };

})();
