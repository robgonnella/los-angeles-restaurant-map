(function(){
  'use strict';

  angular
    .module('la-restaurant-map')
    .controller('MainController', MainController);

  MainController.$inject = ['$http', 'uiGmapGoogleMapApi'];

  function MainController($http, uiGmapGoogleMapApi){
    var vm = this;
    vm.markers = []

    getRestaurants()

    function getRestaurants(){
      $http.get('https://fierce-oasis-92862.herokuapp.com/api/restaurants')
      .then(function(success){
        vm.restaurants = success.data.restaurants;
        vm.restaurants.forEach(function(r) {
          var marker = new google.maps.Marker({
            position: {lat: r.lat, lng: r.lon},
            title: r.name
          })
          vm.markers.push(marker)
        })
      })
      .catch(function(failure){
        console.log("Get Restaurants Error -->", failure);
      })
    }

    uiGmapGoogleMapApi.then(function(map) {
      vm.markers.forEach(function(marker) {
        marker.setMap(map);
      })
    });


    // function initMap() {
    //   var map = new google.maps.Map(document.getElementById('map'), {
    //     center: {lat: 34.052235, lng: -118.243683},
    //     zoom: 12
    //   });
    //   vm.restaurants.forEach(function(r) {
    //     var marker = new google.maps.Marker({
    //       position: {lat: r.lat, lng: r.lon},
    //       map: map,
    //       title: r.name
    //     })
    //   })
    // }

    // function getKey() {
    //   // $http.get("https://fierce-oasis-92862.herokuapp.com/api/getkey")
    //   $http.get("http://localhost:3000/api/getkey")
    //   .then(function(success) {
    //     vm.key = success.data.key
    //     console.log("key -->", vm.key)
    //   })
    //   .catch(function(failure) {
    //     console.log(failure)
    //   })
    // }

  };

})();
