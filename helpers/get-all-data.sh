echo "getting data from yelp..."

sleep 2

node /Users/burlweathers/code/hart-test-app/helpers/get-yelp-data.js

sleep 2

echo "getting data from foursquare..."

node /Users/burlweathers/code/hart-test-app/helpers/get-fsq-data.js
