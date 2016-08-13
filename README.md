# A MAP OF ALL THE RESTAURANTS IN LOS ANGELES!


### Objective:

* Use Yelp API to get a list of Restaurants in Los Angeles area and save in Collection - no duplicates

* Use FourSquare API for additional Restaurants in Los Angeles and save in same Collection - no duplicates

* Use What 3 Words API with LAT LNG info to update a w3w field for all records in from both yelp and foursquare - then access What 3 Words again this time sending back three word phrase to homogenize lattitude and longitude for all records

* Reconsile the two lists so there are no duplicates and save in a separate collection called Reatuarants

* Display all restaurants as markers on a map using Google Maps API

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

##Logic

Use of the async library, Yelps offset and limit parameters, and a list of all zipcodes in Los Angeles are used create a set of signed urls to make requests to the YELP API. Location and category_filter parameters are set to Los Angeles and Restaurants respectively.

FourSquare requests have been created by again using a list of Los Angeles zipcodes along with a query parameter set to 'restaurant' and near parameter set to Los Angeles to create a set of urls for requests.

After data is obtained from yelp and foursquare requests to the What 3 Words API are made to populate the w3w using reverse geocode and then again using forward geocode to homogenize latitude and longitude across the list

The database is synchronously checked for name and location matches before a record is saved in any collection


##Bugs and Missing Features

* unit tests have not been created yet
