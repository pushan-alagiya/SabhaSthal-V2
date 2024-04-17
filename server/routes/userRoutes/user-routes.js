// user routes
const router = require("express").Router();
const verifyToken = require("../../middleware/verifyToken");
const {
  register,
  login,
  updateUser,
  deleteUser,
} = require("../../controllers/userController/user-controller");

// register user
router.post("/register", register);

// login user
router.post("/login", login);

// // update user
router.put("/user", verifyToken, updateUser);

// // delete user
router.delete("/user", verifyToken, deleteUser);

module.exports = router;
