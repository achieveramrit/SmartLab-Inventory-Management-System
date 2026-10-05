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
    batchIssue,
    createManualHistoryEntry,
    deleteManualHistoryEntry
} = require("../controllers/requestController");
const {protect, adminOnly} = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/",      protect, createRequest);
router.post("/batch", protect, createBatchRequest);
router.get("/my",     protect, getMyRequests);
router.get("/settings",  protect, getLabSettings);
router.put("/settings",  protect, adminOnly, updateLabSettings);
router.get("/",          protect, adminOnly, getAllRequests);
router.get("/component/:componentId", protect, adminOnly, getComponentHistory);

// Static PUT routes — must be BEFORE /:id dynamic routes
router.put("/check-overdue", protect, adminOnly, checkOverdue);

// Batch admin actions
router.post("/batch-approve", protect, adminOnly, batchApprove);
router.post("/batch-reject",  protect, adminOnly, batchReject);
router.post("/batch-issue",   protect, adminOnly, batchIssue);

// Manual history (backfill) routes
router.post("/component/:componentId/manual",   protect, adminOnly, createManualHistoryEntry);
router.delete("/manual/:entryId",               protect, adminOnly, deleteManualHistoryEntry);

// Dynamic /:id routes last
router.put("/:id/approve", protect, adminOnly, approveRequest);
router.put("/:id/reject",  protect, adminOnly, rejectRequest);
router.put("/:id/issue",   protect, adminOnly, issueComponent);
router.put("/:id/return",  protect, adminOnly, returnComponent);
router.put("/:id/extend",  protect, extendReturn);

module.exports = router;