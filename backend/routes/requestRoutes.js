const express = require("express");

const {createRequest,getMyRequests,getAllRequests,approveRequest,rejectRequest,issueComponent,returnComponent,checkOverdue} = require("../controllers/requestController");
const {protect,adminOnly} = require("../middleware/authMiddleware");
const router = express.Router();
router.post("/",protect,createRequest);
router.get("/my",protect,getMyRequests);
router.get("/",protect,adminOnly,getAllRequests);
router.put("/:id/approve", protect, adminOnly, approveRequest);
router.put("/:id/reject",protect,adminOnly,rejectRequest);
router.put("/:id/issue",protect,adminOnly,issueComponent);
router.put("/:id/return",protect,adminOnly,returnComponent);
router.put("/check-overdue",protect,adminOnly,checkOverdue);
module.exports = router;