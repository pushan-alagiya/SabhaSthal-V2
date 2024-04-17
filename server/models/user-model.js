// user model for a chat application
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    min: 6,
  },
  rooms: {
    type: Array,
    default: [],
    required: false,
  },
  socketId: {
    type: String,
    default: "",
    required: false,
  },
  userType: {
    type: String,
    default: "user",
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);
