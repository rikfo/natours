const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
// const User = require('./userModel');

//creating a new schema for tours (e.g : blueprints)
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'the name property is missing!'],
      unique: true,
      trim: true,
      maxlength: [50, 'tour name must be between 10 and 50 characters long'],
      minlength: [10, 'tour name must be between 10 and 50 characters long'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'the property duration is missing!'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'the maxGroupSize property is missing!'],
    },
    difficulty: {
      type: String,
      required: [true, 'the difficulty property is missing!'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must be easy or medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4,
      max: [5.0, 'tour rating must be between 1.0 and 5.0'],
      min: [1.0, 'tour rating must be between 1.0 and 5.0'],
      set: (val) => Math.round(val * 10) / 10, // runs everytime there in new value
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'the price property is missing!'],
    },
    discountPrice: {
      type: Number,
      validate: {
        //works only for creating new documents not for update
        validator: function (val) {
          return this.price > val;
        },
        message: 'the price must be greater than the discount price',
      },
    },
    summary: {
      type: String,
      required: [true, 'the summary peroperty is missing!'],
      trim: true, // will remove all whitespaces at the start or at the end
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'the imageCover property is missing!'],
    },
    images: [String], // array of strings
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date], // array of dates
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        // reference to another model
        ref: 'User', // no need to import the user model
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// the value represents the order it takes either 1 (ascending) or -1 (descending)
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//virtual properties are basically properties which won't be saved in the database
tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE : runs before .save() and .create() only
tourSchema.pre('save', function (next) {
  // console.log(this); // will log the current documment
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesProm = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesProm);
//   next();
// });

//runs after .save() and .create()
tourSchema.post('save', function (doc, next) {
  //doc : current document
  //next : function we call to proceed to the next middlware in the stack
  next();
});

//query middleware
tourSchema.pre(/^find/, function (next) {
  //runs in every query
  //this is the current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  }).populate('reviews');
  next();
});

tourSchema.pre('aggregate', function (next) {
  //this is the current aggregation object
  next();
});
//creating a model out of the schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
