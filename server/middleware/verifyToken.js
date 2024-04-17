// create verificartion of token middleare
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  // Get the token from the header
  const token = req.header("Authorization").split(" ")[1];

  // Check if the token exists
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT secret not set");
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
