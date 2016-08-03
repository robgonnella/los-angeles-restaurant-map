(function(){
  'use strict';

  angular
    .module('yelp-fsq-app')
    .controller('MainController', MainController);

  MainController.$inject = ['$http'];

  function MainController($http){
    var vm = this;
    getRestaurants();

    vm.v = {
      name:     "",
      location: "",
      category: ""
    }

    vm.create = createVenue;
    // vm.showV  = showVenue;
    vm.update = updateVenue;
    vm.delete = deleteVenue;
    vm.select = select;
    vm.clear = clear;

    function createVenue() {
      console.log(vm.v)
      $http({
        method: 'POST',
        url: 'http://localhost:3000/api/restaurants',
        data: angular.toJson({ name: vm.v.name, location: vm.v.location})
      })
      .then(function(data){
        console.log(data.data[2].message)
        clear()
        vm.show = false;
      })
      .catch(function(err){
        console.log(err.data)
      })
    }

    function updateVenue(v) {
      $http({
        method: 'PUT',
        url: "http://localhost:3000/api/restaurant/"+v._id,
        data: angular.toJson({name: v.name, location: v.location})
      })
      .then(function(data){
        console.log(data.data);
        clear()
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
      vm.v.category = v.category;
      vm.v._id = v._id;
    }

    function clear(){
      vm.v = {
        name:     "",
        location: "",
        category: ""
      };
    };
  }
})();
