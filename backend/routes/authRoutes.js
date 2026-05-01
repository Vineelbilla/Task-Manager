const express = require("express");
const { signup, login, getUsers } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/users", protect, getUsers);

module.exports = router;
