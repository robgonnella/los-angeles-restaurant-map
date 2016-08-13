(function() {
  'use strict'

  angular
    .module('la-restaurant-map')
    .config('Configuration', Configuration)

  Configuration.$inject = ['uiGmapGoogleMapApiProvider']

  function Configuration(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyAK_NfnLnuWc5QqOQtmvP1YzakuRCodhCs',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });

  }
})();
