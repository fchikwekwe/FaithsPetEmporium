/*
*  Faith's Pet Emporium Main Server
*/

/** Require environment variable(s) */
if (!process.env.PORT) {
  require('dotenv').config();
  process.env.NODE_ENV = "dev"
}

/** Require middlewares */
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const app = express();

/** Database connection */
const mongoose = require('mongoose');

console.log("database connection", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petes-pets', { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected successfully.');
});

/** View engine setup */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

/** override with POST having ?_method=DELETE or ?_method=PUT */
app.use(methodOverride('_method'))

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/** Require controllers */
require('./routes/index.js')(app);
require('./routes/pets.js')(app);

/** catch 404 and forward to error handler */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/** error handler */
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/** PASS KEYS TO TEMPLATE */
app.locals.PUBLIC_STRIPE_API_KEY = process.env.PUBLIC_STRIPE_API_KEY
app.locals.PRIVATE_STRIPE_API_KEY = process.env.PRIVATE_STRIPE_API_KEY

module.exports = app;
