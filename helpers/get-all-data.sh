# use this script to get all data from both yelp and foursquare and save in db
# populate all w3w fields for all restaurants in db

dir=$( cd "$(dirname "${BASH_SOURCE}")" ; pwd -P )

fsq="./helpers/get-fsq-data.js"
yelp="./helpers/get-yelp-data.js"
updatew3w="./helpers/update-w3w-data.js"
hygiene="./helpers/hygiene-data.js"

cwd=$pwd

cd $dir
cd ..

if ! [[ $DB ]] ;
  then
    echo "You are deleting and restoring your local database..."
    sleep 2
    echo "To restore MongoLab/Heroku DB add ENV var DB='production'"
fi

if [[ "$DB" == "production" ]] ;
  then
    echo "process beginning for foursquare data..."
    heroku run node $fsq
    sleep 2
    echo "process beginning for yelp data..."
    sleep 2
    heroku run node $yelp
    sleep 2
    echo "updating w3w info for all restaurants..."
    sleep 2
    heroku run node $updatew3w
    sleep 2
    echo "creating hygiened list and saving in separate restaurants collection..."
    sleep 2
    heroku run node $hygiene
  else
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
    sleep 2
    echo "creating hygiened list and saving in separate restaurants collection..."
    sleep 2
    node $hygiene
  fi

cd $cwd
