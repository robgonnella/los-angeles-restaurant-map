# Hart-Test-App


### Objective:

* Use Yelp API to get a list of Restaurants in Los Angeles area

* Use FourSquare API for additional Restaurants in Los Angeles

* Reconsile the two lists of Restaurants so there are no duplicates

* Use What 3 Words API to update a w3w field for all restaurants in the database

* Create and expose API for app that allowes user to change the category

### Instructions

* execute ./helpers/get-all-data.sh to populate database with all data from yelp and foursquare. This script will also take care of avoiding duplicates and will update w3w fields automatically as well

* scripts can be run individually as well
* 
```
list of helper scripts:
* get-all-data.sh 
* get-yelp-data.js
* get-fsq-data.js
* update-w3w-data.js
```

##API

```
GET    /api/restaurants    --> index (all restaurants)
POST   /api/restaurants    --> create
PUT    /api/restaurant/:id --> update
DELETE /api/restaurant/:id --> destroy
```
##Logic

Use of the async library along with Yelps offset and limit parameters is used to paginate through all Yelps listings. Location and category_filter parameters are set to Los Angeles and Restaurants respectively.

(right now it is not set to go throught all pages as I was afraid I'd go over the allowed number of requests)

FourSquare requests have been created by first creating a list of sub-category IDs for anything in the food category and then made requests for venues for each of those categories in Los Angeles using the "near" parameter

Once all data has been retrieved from both, the list is homogonized by checking to see if the restaurant already exists in the database and saving only if it doesn't.

To check if the resturant already exists in the db, I used latitude, longitude and name attributes. This allows different companies that have the same location (i.e. strip mall) to save properly.

After saving requests to the What 3 Words API are made asynchonously to populate the w3w fields for each restaurant.

##Front End

The UI is created using angularJS and Bootstrap

Users Can Create, Edit, and Destroy restaurants

Request are made using the $http service

##Bugs and Missing Features

* the w3w script - update-w3w-data.js - will sometimes time-out and will need to be run a couple of times to populate all w3w fields properly

* unit tests have not been created yet
