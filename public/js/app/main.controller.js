(function(){
  'use strict';

  angular
    .module('hart-app')
    .controller('HartController', HartController);

  HartController.$inject = ['$http'];

  function HartController($http){
    var vm = this;
    getRestaurants();

    vm.v = {
      name:     "",
      location: ""
    }

    vm.create = createVenue;
    // vm.showV  = showVenue;
    vm.update = updateVenue;
    vm.delete = deleteVenue;
    vm.select = select;

    function createVenue() {
      console.log(vm.v)
      $http({
        method: 'POST',
        url: 'http://localhost:3000/api/restaurants',
        data: angular.toJson({ name: vm.v.name, location: vm.v.location})
      })
      .then(function(data){
        console.log(data.data[2].message)
        vm.v.name = "";
        vm.v.location = "";
        vm.show = false;
      })
      .catch(function(err){
        console.log(err.data)
      })
    }

    // function showVenue(v) {
    //   $http.get('http://localhost:3000/api/restaurant/'+v._id)
    //   .then(function(data){
    //     console.log(data.data.restaurant)
    //     vm.extendedInfo = data.data.restaurant
    //   })
    //   .catch(function(err){
    //     console.log(err)
    //   })
    // }

    function updateVenue(v) {
      $http({
        method: 'PUT',
        url: "http://localhost:3000/api/restaurant/"+v._id,
        data: angular.toJson({name: v.name, location: v.location})
      })
      .then(function(data){
        console.log(data.data);
        vm.v.name = "";
        vm.v.location = "";
        vm.v._id = "";
        vm.showU = false;
        getRestaurants();
      })
      .catch(function(err){
        console.log(err);
      })
    }


    function deleteVenue(v) {
      $http({
        method: 'DELETE',
        url: 'http://localhost:3000/api/restaurant/'+v._id
      })
      .then(function(success){
        console.log("sucessfully deleted restaurant");
        getRestaurants();
      })
      .catch(function(err){
        console.log(err.data)
      });
    }

    function getRestaurants(){
      $http.get('http://localhost:3000/api/restaurants')
      .then(function(data){
        vm.restaurants = data.data.restaurants;
      })
      .catch(function(err){
        console.log(err.data);
      })
    }

    function select(v) {
      vm.v.name = v.name;
      vm.v.location = v.location;
      vm.v._id = v._id;
    }
  }
})();
