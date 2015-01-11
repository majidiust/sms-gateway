var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var users = require('./routes/users');
var sms = require('./routes/sms');
var application = require('./routes/app');
var connectionString = 'mongodb://localhost:27017/SMSGateway';
var mongoose = require('mongoose');
var taskManager = require('./queue/task').TaskManager;
mongoose.connect(connectionString);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json({ keepExtensions: true, uploadDir: "uploads" }));
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    //  console.log(req.url());
    console.log("middle logger layer");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, token");
    next();
});

app.use('/api/v1/users', users);
app.use('/api/v1/sms', sms);
app.use('/api/v1/application', application);
/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

taskManager().initMonitoring(27000);
module.exports = app;