var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

require('dotenv').load();

var env = require('./config/environment')
var mongoose = require('./config/database');

var app = express();

//set up local variables
app.set('title', env.title);
app.set('safe-title', env.safe_title);
app.locals.title = app.get('title');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts/jquery', express.static(__dirname + '/node_modules/jquery/dist'))
app.use('/scripts/lodash', express.static(__dirname + '/node_modules/lodash'))
app.use('/scripts/angular', express.static(__dirname + '/node_modules/angular'))
app.use('/scripts/simple-logger', express.static(__dirname + '/node_modules/angular-simple-logger/dist'))
app.use('/scripts/maps', express.static(__dirname + '/node_modules/angular-google-maps/dist'))

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

// pass app to routers
require('./routes/api-routes')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
