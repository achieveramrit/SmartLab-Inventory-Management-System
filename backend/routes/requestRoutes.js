const express = require("express");

const {
    createRequest,
    createBatchRequest,
    getMyRequests,
    getAllRequests,
    approveRequest,
    rejectRequest,
    issueComponent,
    returnComponent,
    extendReturn,
    getLabSettings,
    updateLabSettings,
    checkOverdue,
    getComponentHistory,
    batchApprove,
    batchReject,
    batchIssue
} = require("../controllers/requestController");
const {protect,adminOnly} = require("../middleware/authMiddleware");
const router = express.Router();
router.post("/", protect, createRequest);
router.post("/batch", protect, createBatchRequest);
router.get("/my", protect, getMyRequests);
router.get("/settings", protect, getLabSettings);
router.put("/settings", protect, adminOnly, updateLabSettings);
router.get("/", protect, adminOnly, getAllRequests);
router.get("/component/:componentId", protect, adminOnly, getComponentHistory);
// Static PUT routes must come BEFORE /:id routes
router.put("/check-overdue", protect, adminOnly, checkOverdue);
// Batch action routes (admin only)
router.post("/batch-approve", protect, adminOnly, batchApprove);
router.post("/batch-reject",  protect, adminOnly, batchReject);
router.post("/batch-issue",   protect, adminOnly, batchIssue);
router.put("/:id/approve", protect, adminOnly, approveRequest);
router.put("/:id/reject", protect, adminOnly, rejectRequest);
router.put("/:id/issue", protect, adminOnly, issueComponent);
router.put("/:id/return", protect, adminOnly, returnComponent);
router.put("/:id/extend", protect, extendReturn);
module.exports = router;