// code to connect to mongodb atlas
const mongoose = require("mongoose");
require("dotenv").config();

const db = mongoose.connection;

if (process.env.NODE_ENV === "production") {
  MONGO_URL = process.env.MONGO_URL_PROD || "mongodb://localhost:27017/prod";
} else {
  MONGO_URL = process.env.MONGO_URL_DEV || "mongodb://localhost:27017/dev";
}

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

module.exports = db;
