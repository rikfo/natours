// the order of code in express is IMPORTANT! //////////////////////////////////////////////////////
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const ErrorHandler = require('./utils/error-handler');
const errorController = require('./controllers/errorController');
const viewRoute = require('./routes/viewRoutes');
const toursRoute = require('./routes/toursRoutes');
const usersRoute = require('./routes/usersRoutes');
const reviewRoute = require('./routes/reviewRoutes');
const bookingRoute = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));

///////////////////////////////////////////////////////////////////------------MIDDLEWARES-----------/////////////////////////////////////////////////////////////////////////////////////
//provided middleware
//middleware : is a function that stands between req and res to manipulate data
app.use(express.json());

// set security HTTP headers
app.use(helmet());

// third-party middleware
const morgan = require('morgan');
app.use(morgan('dev'));

// app.use(
//   cors({
//     origin: 'http://localhost:3000',
//     credentials: true,
//   })
// );

const limiter = rateLimit({
  max: 1000, // maximum number of requests
  windowMs: 60 * 60 * 100, // time to wait after maximum number reached
  message: 'too many requests from this IP, please try again in 1 hour!',
});
app.use('/api', limiter);

// cookie-parser
app.use(cookieParser());
//body parser, reading data from body into req.body:
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// data sanitization against NoSql query injection
app.use(mongoSanitize()); // that's it :D

// data sanitiaztion against XSS
app.use(xss()); // prevent attackers from injecting a malicious code

// prevent parameters polution
app.use(
  hpp({
    // whitelist specific fields
    whitelist: ['duration'],
  })
);

//serving static files from a folder :
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, `/public`)));

//create our own middleware
app.use((req, res, next) => {
  //console.log('middleware saying hello to you :) !');
  //the next function of a middleware is like a green trafic light to continue the process you need to make sure to call it in the end of every middleware !
  //if you don't then the code will stop at that middleware
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use((req, res, next) => {
  res.set('Content-Security-Policy', ``);
  next();
});

// ROUTES
app.use('/', viewRoute);
app.use('/api/v1/tours', toursRoute);
app.use('/api/v1/users', usersRoute);
app.use('/api/v1/reviews', reviewRoute);
app.use('/api/v1/bookings', bookingRoute);

// handling undefiend routes:
// this should be the last handler THE ORDER IS IMPORTANT
app.use('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `cannot find the url : ${req.originalUrl} on this server!`,
  // });
  next(
    new ErrorHandler(
      `cannot find the url : ${req.originalUrl} on this server!`,
      404
    )
  );
});

app.use(errorController);

module.exports = app;
