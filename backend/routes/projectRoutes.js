const express = require("express");
const {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    seedDefaultProjects
} = require("../controllers/projectController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getProjects);
router.post("/seed", protect, adminOnly, seedDefaultProjects);
router.get("/:id", protect, getProjectById);
router.post("/", protect, adminOnly, createProject);
router.put("/:id", protect, adminOnly, updateProject);
router.delete("/:id", protect, adminOnly, deleteProject);

module.exports = router;
