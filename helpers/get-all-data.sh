# use this script to get all data from both yelp and foursquare and save in db
# populate all w3w fields for all restaurants in db

dir=$( cd "$(dirname "${BASH_SOURCE}")" ; pwd -P )

fsq=$dir/get-fsq-data.js
yelp=$dir/get-yelp-data.js
updatew3w=$dir/update-w3w-data.js
hygiene=$dir/hygiene-data.js

cwd=$pwd

cd $dir
cd ..

echo "process beginning for foursquare data..."

node $fsq

sleep 2

echo "process beginning for yelp data..."

sleep 2

node $yelp

sleep 2

echo "updating w3w info for all restaurants..."

sleep 2

node $updatew3w

echo "creating hygiened list and saving in separate restaurants collection..."

sleep 2

node $hygiene

cd $cwd
