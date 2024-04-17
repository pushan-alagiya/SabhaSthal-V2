const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");

let PORT;
const path = require("path");
var cors = require("cors");
const socketManager = require("./sockets/sockerManager");
const userRouter = require("./routes/userRoutes/user-routes");
const adminRouter = require("./routes/adminRoutes/admin-routes");

// Load env variables
require("dotenv").config();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =============== Load database ============================

require("./database/db");

// =============== Routes ==================================

app.use(userRouter);
app.use(adminRouter);

// =============== CORS =====================================

app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// ============= static Path =====================================

app.use(express.static(path.join(__dirname, "public")));

// ============= Production specification ========================

if (process.env.NODE_ENV === "production") {
  PORT = process.env.PORT_PROD || 5000;
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });
} else {
  PORT = process.env.PORT_DEV || 3001;
}

// ================== Route ping =================================

app.get("/ping", (req, res) => {
  res
    .send({
      success: true,
    })
    .status(200);
});

// ================== Sockets ====================================
socketManager(io);

http.listen(PORT, () => {
  console.log("Connected : ", PORT);
});
