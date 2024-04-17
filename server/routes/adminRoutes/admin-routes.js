// user routes
const router = require("express").Router();
const {
  getallUsers,
} = require("../../controllers/adminController/user-management");

// // get user
router.get("/user", getallUsers);

// // // update user
// router.put("/user", updateUser);

// // // delete user
// router.delete("/user", deleteUser);

module.exports = router;
