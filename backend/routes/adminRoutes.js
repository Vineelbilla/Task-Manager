const express = require("express");
const { getUserStats } = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("Admin"));

router.get("/user-stats", getUserStats);

module.exports = router;
