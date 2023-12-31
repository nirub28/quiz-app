const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  score: Number,
});

const roomSchema = new mongoose.Schema({
  users: [userSchema],
  answers: [Number],
  completeUserCount: {
    type: Number,
    default: 0, 
  },

});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
