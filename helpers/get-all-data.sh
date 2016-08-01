# use this script to get all data from both yelp and foursquare and save in db
# populate all w3w fields for all restaurants in db

echo "getting data from yelp..."

sleep 2

node /Users/burlweathers/code/hart-test-app/helpers/get-yelp-data.js

sleep 2

echo "getting data from foursquare..."

node /Users/burlweathers/code/hart-test-app/helpers/get-fsq-data.js

sleep 2

echo "updating w3w info for all restaurants..."

sleep 2

node /Users/burlweathers/code/hart-test-app/helpers/update-w3w-data.js
