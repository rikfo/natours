const fs = require('fs');

const mongoose = require('mongoose');

const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });

const dataBase = process.env.DB.replace('<password>', process.env.DB_PASSWORD);

mongoose
  .connect(dataBase, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('your connection to "' + dataBase + '" was successful!');
  });

// Read json file
const tours = JSON.parse(fs.readFileSync(__dirname + '/tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync(__dirname + '/users.json', 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(__dirname + '/reviews.json', 'utf-8')
);

// import data into db
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('data successfully loaded!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// delete data from db
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data deleting successful!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--import') importData();
else if (process.argv[2] === '--delete') deleteData();
