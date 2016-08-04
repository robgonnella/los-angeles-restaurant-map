# use this script to get all data from both yelp and foursquare and save in db
# populate all w3w fields for all restaurants in db

echo "process beginning for yelp data..."

sleep 2

node /Users/burlweathers/code/yelp-foursquare-example/helpers/get-yelp-data.js

sleep 2

echo "process beginning for foursquare data..."

node /Users/burlweathers/code/yelp-foursquare-example/helpers/get-fsq-data.js

sleep 2

echo "updating w3w info for all restaurants..."

sleep 2

node /Users/burlweathers/code/yelp-foursquare-example/helpers/update-w3w-data.js
