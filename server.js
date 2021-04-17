const mongoose = require('mongoose');

const dotenv = require('dotenv');

// uncaught exception : bugs that isn't handled anywhere
// this code must be on top before any other code
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const dataBase = process.env.DB.replace('<password>', process.env.DB_PASSWORD);

mongoose
  .connect(dataBase, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('your connection was successful!');
  });

//creating new tour
//const testTour = new Tour({
//name: 'The Midnight Sun',
//rating: 4.8,
//price: 599,
//});

//storing the tour in the database
//testTour
//  .save()
//  .then((doc) => {
//    console.log('tour stored successfully!\n' + doc);
//  })
//  .catch((err) => {
//    console.log('an error occured! : ' + err);
//  });

///////////////////////////////////////////////////////////////////------------STARTING THE SERVER-----------/////////////////////////////////////////////////////////////////////////////////////
const port = 3000;

const server = app.listen(port, () => {
  console.log('App running on port :' + port);
});

//global promises errors handling
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
