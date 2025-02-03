const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  profilePicture: { type: String, default: '' },
  weight: { type: Number, default: null }, // in lbs
  height: { type: Number, default: null }, // stored in inches
  dateOfBirth: { type: Date, default: null },
  sex: { type: String, enum: ['male', 'female'] },
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
