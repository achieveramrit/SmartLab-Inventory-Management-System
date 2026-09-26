const express = require("express");
const {
    getComponents,getComponent,addComponent,updateComponent,deleteComponent} = require("../controllers/componentController");
const {
    protect,adminOnly} = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", protect, getComponents);
router.get("/:id", protect, getComponent);
router.post("/", protect, adminOnly, addComponent);
router.put("/:id", protect, adminOnly, updateComponent);
router.delete("/:id", protect, adminOnly, deleteComponent);
module.exports = router;