const express = require('express');

const toursControllers = require('../controllers/toursController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

//router.param('id', toursControllers.checkID);

// for this specific route we want to use reviewRouter
router.use('/:tourId/reviews', reviewRouter);

// alias :
router
  .route('/top-5-cheap-tours')
  .get(toursControllers.cheapTours, toursControllers.getAllTours);

router.route('/tour-stats').get(toursControllers.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    toursControllers.getMonthlyPlan
  );

router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(toursControllers.getTourWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(toursControllers.getDistances);

router
  .route('/')
  .get(toursControllers.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursControllers.createTour
  );
router
  .route('/:id')
  .get(toursControllers.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursControllers.uploadTourImages,
    toursControllers.resizeTourImages,
    toursControllers.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursControllers.deleteTour
  );

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

module.exports = router;
