const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const ErrorHandler = require('../utils/error-handler');

exports.getOverview = catchAsync(async (req, res) => {
  //1 ) get tour data from the collection
  const tours = await Tour.find().populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  //2 ) build template

  //3 ) render that template using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) getting the tout from the collection
  const tour = await Tour.findOne({ slug: req.params.slug });
  if (!tour) {
    return next(new ErrorHandler('There is no tour with that name', 404));
  }
  // 2) build template
  // 3) render the template using tour data from 1
  // res.set('Content-Security-Policy', ``);
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) find tours with returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.login = catchAsync(async (req, res) => {
  // const user = await User.find({email: });
  res.status(200).render('login', {
    title: 'Login',
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updateUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'My Account',
    user: updateUser,
  });
});
