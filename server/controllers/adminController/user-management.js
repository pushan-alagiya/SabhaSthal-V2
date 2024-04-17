// controller for user
const User = require("../../models/user-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const validator = require("validator");

// =============== Get User ===================================

const getallUsers = async (req, res) => {
  try {
    // check if the token is provided
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token provided!! Login Again" });
    }

    // verify the token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid user type" });
      }

      if (decoded.userType !== "admin") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // get all users
      const users = await User.find({});

      // return all users
      res.status(200).json(users);
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getallUsers,
};
