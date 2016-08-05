# Yelp FourSquare API Example APP


### Objective:

* Use Yelp API to get a list of Restaurants in Los Angeles area and save in Yelp Collection

* Use FourSquare API for additional Restaurants in Los Angeles and save in FourSquare Collection

* Use What 3 Words API to update a w3w field for all records in both yelp and foursquare collections

* Reconsile the two lists so there are no duplicates and save in a separate collection called Reatuarants

* Create and expose API for app that allowes user to change the category

### Instructions

* create .env file with license info set in the following variables: YELP_CONSUMER_KEY, YELP_CONSUMER_SECRET, YELP_TOKEN, YELP_TOKEN_SECRET, FS_ID, FS_SECRET, W3W_KEY

* execute ./helpers/get-all-data.sh to populate database with all data from yelp and foursquare. This script will also take care of avoiding duplicates and will update w3w fields automatically as well

* scripts can be run individually as well

```
list of helper scripts:
* get-all-data.sh
* get-yelp-data.js
* get-fsq-data.js
* update-w3w-data.js
* hygiene-data.js
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

After data is obtained from yelp and foursquare requests to the What 3 Words API are made to populate the w3w using reverse geocode

Lodash uniqBy is used to create the unique list. The app then checks the database to see if the restaurant already exists in the database and saving only if it doesn't.

To check if the resturant already exists in the db, I used location and name attributes. This allows different companies to have the same location (i.e. strip mall).

##Front End

The UI is created using angularJS and Bootstrap

Users Can Create, Edit, and Destroy restaurants

Request are made using the $http service

##Bugs and Missing Features

* unit tests have not been created yet
