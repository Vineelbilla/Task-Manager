const express = require("express");
const {
  createProject,
  getProjects,
  addMemberToProject,
  updateProjectMembers,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.route("/").post(authorizeRoles("Admin"), createProject).get(getProjects);
router
  .route("/:id")
  .put(authorizeRoles("Admin"), updateProject)
  .delete(authorizeRoles("Admin"), deleteProject);
router.post("/:id/add-member", authorizeRoles("Admin"), addMemberToProject);
router.put("/:id/members", authorizeRoles("Admin"), updateProjectMembers);

module.exports = router;
