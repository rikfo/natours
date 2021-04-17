const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a user must have a name!'],
    minlength: [5, 'the name must be more than 4 characters!'],
    maxlength: [30],
  },
  email: {
    type: String,
    required: [true, 'the email is required!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'the email is not valid!'], // custom validator to validate the email
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'the password is required!'],
    minlength: [8, 'the password must be 8 characters long or more!'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'password confirmation is required!'],
    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: `the password confirmation isn't correct!`,
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiration: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  //encrypting the password the higher the salt value is, the higher cpu work
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.checkPassword = async function (candPW, usrPW) {
  // this.password is not available because it's not selected
  return await bcrypt.compare(candPW, usrPW);
};

userSchema.methods.changedPWAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);

    return JWTTimeStamp < changedimestamp;
  }

  // false means not changed :)
  return false;
};

userSchema.methods.createPWResetTkn = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpiration = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
