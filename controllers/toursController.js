const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('../controllers/handlerFactory');
// const APIFeatures = require('../utils/api-features');
const ErrorHandler = require('../utils/error-handler');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  //!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)
  if (file.mimetype.startsWith('image')) {
    return cb(null, true);
  }
  return cb(
    new ErrorHandler('Not an image please upload images only!', 400),
    false
  );
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Image

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile('public/img/tours/' + req.body.imageCover);
  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile('public/img/tours/' + fileName);

      req.body.images.push(fileName);
    })
  );
  next();
});

/////////////////////////
exports.cheapTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage+price';
  req.query.fields = 'name ratingAverage price difficulty summary';

  next();
};

exports.getTour = handlerFactory.getOne(Tour);

exports.getAllTours = handlerFactory.getAll(Tour);

exports.createTour = handlerFactory.createOne(Tour);

exports.updateTour = handlerFactory.updateOne(Tour);

exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const toursStats = await Tour.aggregate([
    {
      $match: { duration: { $gte: 5 } }, // result will match every tour that has the duration gte 5 (it's like filtering)
    },
    {
      $group: {
        _id: '$difficulty', // _id means which field we want to group by
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      //$match: { minPrice: { $gte: 2000 } }, // we can sppecify another match operator but we can use only the fields name given in the group operator
      $sort: { avgPrice: 1 }, // ascending order
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      toursStats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // destruct an array and show all results
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 }, // calualtes number of tours
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0, // show or hide fields 0: to hide 1: to show
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // divided by the raduis of the earth

  if (!lat || !lng)
    new ErrorHandler(
      'please provide latitude and longitude in this fotmat : lat,lng',
      400
    );

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    new ErrorHandler(
      'please provide latitude and longitude in this fotmat : lat,lng',
      400
    );

  const distances = await Tour.aggregate([
    {
      // should always be the 1st one
      $geoNear: {
        // starting point
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      dist: distances,
    },
  });
});

//references
{
  //reading the tours json file:
  /*const tours = JSON.parse(
  fs.readFileSync(__dirname + '/../dev-data/data/tours-simple.json', 'utf-8')
);*/
  //its a good practice to use middleware functions for checking the validity of data
  /*exports.checkID = (req, res, next, val) => {
  console.log('middleware check working fine');
  if (val >= tours.length)
    return res.status(404).json({
      status: 'fail',
      message: 'tour does not exist',
    });
  next();
};*/
  //check request body middleware function
  /*exports.checkReqBody = (req, res, next) => {
  if (!req.body.name || !req.body.price)
    return res.status(400).json({
      status: 'fail',
      message: 'YOU MUST ENTER A VALID NAME AND PRICE TO THE TOUR!',
    });
  next();
};
*/
  // exports.getTour = catchAsync(async (req, res, next) => {
  //   const id = req.params.id;
  //   // populate will fill the guides property in the schema with the corresponding data
  //   const tour = await Tour.findById(id).populate('reviews');
  //   if (!tour) {
  //     return next(new ErrorHandler('no tour found with the given ID!', 404));
  //   }
  //   res.status(200).json({
  //     status: 'success',
  //     data: {
  //       tour,
  //     },
  //   });
  // });
  // exports.createTour = catchAsync(async (req, res, next) => {
  //   //const newId = tours.length;
  //   //Object assign allows us to merge two objects into one
  //   //const newTour = Object.assign({ id: newId }, req.body);
  //   //create a new tour:
  //   //1st method:
  //   //const newTour = new Tour({...})
  //   //newTour.save();
  //   //2nd methode (promises)
  //   //const newTour = Tour.create({...}).then();
  //   //3th methode (async/await)
  //   const newTour = await Tour.create(req.body);
  //   res.status(201).json({
  //     status: 'success',
  //     data: {
  //       tour: newTour,
  //     },
  //   });
  // });
  // exports.updateTour = catchAsync(async (req, res, next) => {
  //   //const tour = await Tour.findById((id = '603974dc30cb58579d729d2e'));
  //   //we can use also a shorthand method findByIdAndUpdate(filterField, updatedData, {options...});
  //   //options like new which makes sure of returning the new updated document
  //   //and runValidators which makes sure of running schema validators
  //   const id = req.params.id;
  //   const tour = await Tour.findByIdAndUpdate(id, req.body, {
  //     new: true,
  //     runValidators: true,
  //   });
  //   /////////MY APPROACH :'( //////////////
  //   /*const tour = await Tour.updateOne(
  //       { _id: '603a4a68ceb1c02708004ce7' },
  //       {
  //         $set: {
  //           name: req.body.name,
  //           price: req.body.price,
  //           rating: req.body.rating,
  //         },
  //       }
  //     );*/
  //   if (!tour) {
  //     return next(new ErrorHandler('no tour found with the given ID!', 404));
  //   }
  //   res.status(200).json({
  //     status: 'success',
  //     data: {
  //       tour,
  //     },
  //   });
  // });
  // exports.deleteTour = catchAsync(async (req, res, next) => {
  //   const id = +req.params.id;
  //   //const tour = tours[id];
  //   //const tour = await Tour.deleteOne({ _id: req.params.id });
  //   const tour = await Tour.findByIdAndDelete(id);
  //   if (!tour) {
  //     return next(new ErrorHandler('no tour found with the given ID!', 404));
  //   }
  //   res.status(204).json({
  //     status: 'success',
  //     data: null,
  //   });
  //   console.log('tour deleted successfully! ' + tour);
  // });
  // aggregation pipeline matching and grouping :
}
